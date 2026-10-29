import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_URL } from "@/api/config";
import { colors, spacing } from "@/constants/theme";

// Écran temporaire : vérifie que l'app joint bien l'API (route /health).
export default function Home() {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => setStatus(res.ok ? "ok" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>WAVE</Text>
      <View style={styles.status}>
        <View style={[styles.dot, { backgroundColor: DOT_COLORS[status] }]} />
        <Text style={styles.statusText}>{STATUS_LABELS[status]}</Text>
      </View>
      <Text style={styles.url}>{API_URL}</Text>
    </SafeAreaView>
  );
}

const STATUS_LABELS = {
  checking: "Connexion à l'API…",
  ok: "API connectée",
  error: "API injoignable",
};

const DOT_COLORS = {
  checking: colors.textMuted,
  ok: colors.success,
  error: colors.danger,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    gap: spacing.md,
  },
  title: {
    fontSize: 48,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 2,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { color: colors.text, fontWeight: "600" },
  url: { color: colors.white, opacity: 0.8, fontSize: 12 },
});
