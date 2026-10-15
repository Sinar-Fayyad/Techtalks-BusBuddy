import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ActivityIndicator, Pressable, Alert, BackHandler, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// SDK 54+ → "expo-file-system/legacy"; on SDK ≤53 → "expo-file-system"
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiFetch, BASE_URL } from "../../api";
import Button from "../components/Button";

export default function DriverStatusScreen({ token, onBack, onLogout, onSessionExpired }) {
  const [view, setView] = useState("loading"); // loading | ready | none | error
  const [driver, setDriver] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // ← T6: alive = screen still mounted; inFlight = a request is already running
  const alive = useRef(true);
  const inFlight = useRef(false);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  async function loadStatus({ silent = false } = {}) {
    if (inFlight.current) return; // ← T6: rapid taps collapse to one request
    inFlight.current = true;
    if (silent) setRefreshing(true); else setView("loading"); // ← T6: refresh keeps the content
    setError("");
    try {
      const me = await apiFetch("/api/driver/me", token);
      if (!alive.current) return;
      if (me.status === 401) return onSessionExpired();
      if (me.status === 404) { setDriver(null); setView("none"); return; }
      if (!me.ok) throw new Error(`status ${me.status}`);
      const d = me.data && me.data.driver;
      if (!d) { setDriver(null); setView("none"); return; } // ← T6: malformed 200 must not crash
      setDriver(d);
      setView("ready");
    } catch (e) {
      if (!alive.current) return;
      console.error(e);
      setError("Cannot reach the server. Check Wi-Fi and that the web server is running.");
      if (!silent) setView("error");
    } finally {
      inFlight.current = false;
      if (alive.current) setRefreshing(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // ← T6: subscribe once, read the latest onBack from a ref — a re-subscribing effect
  // can drop a hardware-back press during its remove/add window.
  const onBackRef = useRef(onBack);
  useEffect(() => { onBackRef.current = onBack; }, [onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBackRef.current();
      return true; // handled → don't close the app
    });
    return () => sub.remove();
  }, []);

  const licenseName = driver && driver.license_url ? driver.license_url.split("/").pop() : null;

  async function openLicense() {
    if (!licenseName || downloading) return; // ← T6: guard on top of Pressable disabled
    try {
      setDownloading(true);
      setError("");
      const fileUri = `${FileSystem.cacheDirectory}${licenseName}`;
      const { uri, status } = await FileSystem.downloadAsync(
        `${BASE_URL}/api/driver/license/${licenseName}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (status !== 200) throw new Error(`License download failed (${status})`);
      if (!alive.current) return; // ← T6: don't pop a share sheet after Back/Log out

      if (await Sharing.isAvailableAsync()) {
        const shareUri = Platform.OS === "android" ? await FileSystem.getContentUriAsync(uri) : uri;
        await Sharing.shareAsync(shareUri);
      } else {
        Alert.alert("License downloaded", uri);
      }
    } catch (e) {
      if (!alive.current) return;
      console.error(e);
      setError("Could not open the license file.");
    } finally {
      if (alive.current) setDownloading(false);
    }
  }

  function shell(content) {
    return (
      <LinearGradient
        colors={["#06b6d4", "#3b82f6", "#a855f7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.flex}
      >
        <View style={s.header}>
          <Pressable onPress={onBack} style={s.headerBtn}>
            <Text style={s.headerBtnText}>‹ Back</Text>
          </Pressable>
          <Pressable onPress={onLogout} style={s.headerBtn}>
            <Text style={s.headerBtnText}>Log out</Text>
          </Pressable>
        </View>
        {content}
      </LinearGradient>
    );
  }

  if (view === "loading") {
    return shell(
      <View style={s.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (view === "error") {
    return shell(
      <View style={s.container}>
        <Text style={s.title}>Driver status</Text>
        <View style={[s.card, s.cardRed]}>
          <Text style={s.cardTitle}>Connection problem</Text>
          <Text style={s.cardText}>{error}</Text>
        </View>
        <Button
          label="Retry"
          onPress={() => loadStatus()}
          loading={refreshing}
          style={s.button}
          textStyle={s.buttonText}
        />
      </View>
    );
  }

  if (view === "none") {
    return shell(
      <View style={s.container}>
        <Text style={s.title}>Driver status</Text>
        <View style={s.card}>
          <Text style={s.cardTitle}>No driver profile</Text>
          <Text style={s.cardText}>
            Your account has no driver profile yet. Register a driver profile with your license to get verified.
          </Text>
        </View>
        <Button
          label="Refresh"
          onPress={() => loadStatus({ silent: true })}
          loading={refreshing}
          style={s.button}
          textStyle={s.buttonText}
        />
      </View>
    );
  }

  const { status, name, email } = driver;
  const badge =
    status === "verified"
      ? { label: "✓ Verified", style: s.badgeGreen }
      : status === "rejected"
      ? { label: "✗ Rejected", style: s.badgeRed }
      : { label: "⏳ Pending approval", style: s.badgeAmber };

  return shell(
    <View style={s.container}>
      <Text style={s.title}>Driver status</Text>

      <View style={[s.badge, badge.style]}>
        <Text style={s.badgeText}>{badge.label}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>{name}</Text>
        <Text style={s.cardText}>{email}</Text>
      </View>

      {error !== "" && <Text style={s.error}>{error}</Text>}

      {licenseName ? (
        <Pressable style={s.card} onPress={openLicense} disabled={downloading}>
          <Text style={s.cardTitle}>📄 {licenseName}</Text>
          <Text style={s.cardText}>{downloading ? "Opening…" : "Tap to view"}</Text>
        </Pressable>
      ) : (
        <Text style={s.subtitle}>No license file on record.</Text>
      )}

      <Button
        label="Refresh"
        onPress={() => loadStatus({ silent: true })}
        loading={refreshing}
        style={s.button}
        textStyle={s.buttonText}
      />
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingHorizontal: 24 },
  headerBtn: { backgroundColor: "rgba(15,23,42,0.85)", borderRadius: 20, paddingVertical: 8, paddingHorizontal: 18 },
  headerBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { color: "#fff", fontSize: 28, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  subtitle: { color: "#e0f2fe", textAlign: "center", marginBottom: 16 },
  card: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderColor: "rgba(191,219,254,0.7)",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardRed: { borderColor: "#fca5a5" },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginBottom: 6 },
  cardText: { color: "#e0f2fe", fontSize: 14, lineHeight: 20 },
  badge: { alignSelf: "center", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, marginBottom: 16 },
  badgeGreen: { backgroundColor: "#e3f7e8" },
  badgeAmber: { backgroundColor: "#fdf2d9" },
  badgeRed: { backgroundColor: "#fde3e3" },
  badgeText: { fontWeight: "700" },
  error: { color: "#fecaca", textAlign: "center", marginBottom: 12 },
  button: { backgroundColor: "#0f172a", borderRadius: 24, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});