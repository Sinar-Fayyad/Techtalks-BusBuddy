import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Button from "../components/Button"; // ① match the real relative path in your project

// ② REPLACE both with the real endpoints from API_CONTRACT.md (Step 1)
const STATUS_URL = "/api/driver/status";
const LICENSE_URL = "/api/driver/license"; // e.g. /api/license/:id — CHECK THE CONTRACT

// ③ Match these to DriverTripScreen.js (BASE_URL import + SecureStore key names)
import { BASE_URL } from "../config";

const TOKEN_KEY = "bb_token"; // ④ check DriverTripScreen — must match

export default function DriverStatusScreen({ navigation }) {
  const [status, setStatus] = useState("pending");
  const [license, setLicense] = useState(null); // { id, filename } — adapt to contract fields
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  // 401 anywhere → clear session → login (same as DriverTripScreen)
  const handle401 = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    // ⑤ also clear role key if your app stores one (check DriverTripScreen)
    navigation.replace("Login"); // ⑥ match how DriverTripScreen routes on 401
  };

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError("");
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) return handle401();

      const res = await fetch(`${BASE_URL}${STATUS_URL}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` }, // Bearer-header only — contract rule
      });
      if (res.status === 401) return handle401();

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load status");
      }
      // ⑦ ADAPT these three lines to the real response shape (write it down from the contract)
      setStatus(data.driver.status);
      setLicense(data.driver.license ?? null);
      setReason(data.driver.rejection_reason ?? "");
    } catch (e) {
      setError(e.message);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const openLicense = async () => {
    if (!license) return;
    try {
      setDownloading(true);
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const name = license.filename || "license-file";
      const fileUri = `${FileSystem.cacheDirectory}${name}`;

      const { uri, status: dl } = await FileSystem.downloadAsync(
        `${BASE_URL}${LICENSE_URL}`,
        fileUri,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (dl !== 200) throw new Error("License download failed");

      const target = await FileSystem.getContentUriAsync(uri);
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("License downloaded", uri);
        return;
      }
      await Sharing.shareAsync(target);
    } catch (e) {
      setError(e.message);
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={s.wrap}>
      <Text style={s.title}>Driver status</Text>
      {error ? <Text style={s.error}>{error}</Text> : null}

      <View style={[s.badge, status === "verified" && s.badgeGreen, status === "pending" && s.badgeAmber, status === "rejected" && s.badgeRed]}>
        <Text style={s.badgeText}>
          {status === "verified" ? "✓ Verified" : status === "pending" ? "⏳ Pending approval" : "✗ Rejected"}
        </Text>
      </View>

      {status === "rejected" && reason ? (
        <Text style={s.reason}>Reason: {reason}</Text>
      ) : null}

      {license ? (
        <Pressable style={s.licenseCard} onPress={openLicense}>
          <Text style={s.licenseName}>📄 {license.filename}</Text>
          <Text style={s.licenseHint}>
            {downloading ? "Opening…" : "Tap to view"}
          </Text>
        </Pressable>
      ) : (
        <Text style={s.muted}>No license file on record.</Text>
      )}

      <Button title="Back" onPress={() => navigation.goBack?.() ?? navigation.navigate("Home")} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  wrap: { padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: "700" },
  error: { color: "#b00020" },
  badge: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignSelf: "flex-start" },
  badgeGreen: { backgroundColor: "#e3f7e8" },
  badgeAmber: { backgroundColor: "#fdf2d9" },
  badgeRed: { backgroundColor: "#fde3e3" },
  badgeText: { fontWeight: "600" },
  reason: { color: "#b00020" },
  licenseCard: { borderWidth: 1, borderColor: "#ccc", borderRadius: 10, padding: 14 },
  licenseName: { fontWeight: "600" },
  licenseHint: { color: "#555", marginTop: 4 },
  muted: { color: "#777" },
});