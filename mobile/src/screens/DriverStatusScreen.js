import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert, BackHandler, Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// SDK 54+ → "expo-file-system/legacy"; on SDK ≤53 → "expo-file-system"
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { apiFetch, BASE_URL } from "../../api"; // ← same path apiFetch uses in DriverTripScreen
import Button from "../components/Button";

// Props mirror DriverTripScreen: this app has no navigator, screens get callbacks.
export default function DriverStatusScreen({ token, onBack, onLogout, onSessionExpired }) {
  const [view, setView] = useState("loading"); // loading | ready | none | error
  const [driver, setDriver] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function loadStatus() {
    setError("");
    setView("loading");
    try {
      // Contract entry 6 — the caller's own driver row, found from the token.
      const me = await apiFetch("/api/driver/me", token);
      if (me.status === 401) return onSessionExpired();
      if (me.status === 404) return setView("none"); // no driver profile yet
      if (!me.ok) throw new Error(`status ${me.status}`);
      setDriver(me.data.driver);
      setView("ready");
    } catch (e) {
      console.error(e);
      setView("error");
      setError("Cannot reach the server. Check Wi-Fi and that the web server is running.");
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  // Android hardware back behaves exactly like the on-screen Back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack();
      return true; // handled → don't close the app
    });
    return () => sub.remove();
  }, [onBack]);

  // license_url looks like "/uploads/license_12.pdf" (entry 7) → keep only the file name.
  const licenseName = driver && driver.license_url ? driver.license_url.split("/").pop() : null;

  async function openLicense() {
    if (!licenseName) return;
    try {
      setDownloading(true);
      setError("");
      const fileUri = `${FileSystem.cacheDirectory}${licenseName}`;
      // Entry 8 needs the Bearer header — fine in a native download (that's why web needs lib/view-license.ts).
      const { uri, status } = await FileSystem.downloadAsync(
        `${BASE_URL}/api/driver/license/${licenseName}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (status !== 200) throw new Error(`License download failed (${status})`);

      if (await Sharing.isAvailableAsync()) {
        // getContentUriAsync is Android-only.
        const shareUri = Platform.OS === "android" ? await FileSystem.getContentUriAsync(uri) : uri;
        await Sharing.shareAsync(shareUri);
      } else {
        Alert.alert("License downloaded", uri);
      }
    } catch (e) {
      console.error(e);
      setError("Could not open the license file.");
    } finally {
      setDownloading(false);
    }
  }

  // Same gradient + logout shell as DriverTripScreen; the Back button sits next to Log out.
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
        <Button label="Retry" onPress={loadStatus} style={s.button} textStyle={s.buttonText} />
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

      <Button label="Refresh" onPress={loadStatus} style={s.button} textStyle={s.buttonText} />
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