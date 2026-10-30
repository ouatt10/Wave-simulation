import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/api/wave";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { phoneFromQr } from "@/utils/qr";

const FRAME = 240;

export default function ScanScreen() {
  const { withoutLock } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  // La caméra lit le même code plusieurs fois par seconde : on n'en traite qu'un à la fois.
  const handlingRef = useRef(false);

  const onScanned = async ({ data }) => {
    if (handlingRef.current) return;
    handlingRef.current = true;

    const phone = phoneFromQr(data);
    if (!phone) {
      setError("Ce n'est pas un code QR WAVE.");
      setTimeout(() => (handlingRef.current = false), 1500);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const recipient = await api.lookup(phone);
      router.replace({
        pathname: "/transfer/amount",
        params: { phone: recipient.phone, name: recipient.full_name },
      });
    } catch (err) {
      setError(err.message);
      setTimeout(() => (handlingRef.current = false), 1500);
    } finally {
      setBusy(false);
    }
  };

  if (!permission) return <Screen />; // statut de l'autorisation en cours de lecture

  if (!permission.granted) {
    return (
      <Screen>
        <Header title="Scanner" />
        <View style={styles.permission}>
          <Ionicons name="camera-outline" size={56} color={colors.textMuted} />
          <Text style={styles.permissionText}>
            WAVE a besoin de la caméra pour scanner le code QR d&apos;un autre compte.
          </Text>
          {/* La fenêtre d'autorisation met l'app en arrière-plan sur Android : pas de verrouillage. */}
          <Button title="Autoriser la caméra" onPress={() => withoutLock(requestPermission)} />
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={busy ? undefined : onScanned}
      />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Retour">
          <Ionicons name="close" size={30} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>Scanner un code QR</Text>
        <View style={styles.side} />
      </View>

      <View style={styles.center} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Place le code QR WAVE dans le cadre</Text>
        {busy && <ActivityIndicator color={colors.white} style={styles.spinner} />}
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  side: { width: 30 },
  title: { color: colors.white, fontSize: 18, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  frame: {
    width: FRAME,
    height: FRAME,
    borderWidth: 3,
    borderColor: colors.white,
    borderRadius: radius.lg,
  },
  hint: { color: colors.white, marginTop: spacing.lg, fontSize: 15, fontWeight: "600" },
  spinner: { marginTop: spacing.md },
  error: {
    color: colors.white,
    backgroundColor: colors.danger,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    overflow: "hidden",
    textAlign: "center",
  },
  permission: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  permissionText: { textAlign: "center", color: colors.text, fontSize: 16 },
});
