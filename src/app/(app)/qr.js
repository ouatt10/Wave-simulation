import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import Header from "@/components/Header";
import QrCode from "@/components/QrCode";
import Screen from "@/components/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatPhone } from "@/utils/format";
import { qrPayload } from "@/utils/qr";

export default function MyQrScreen() {
  const { user } = useAuth();
  if (!user) return null; // pendant la déconnexion, avant la redirection

  return (
    <Screen style={styles.screen}>
      <Header title="Mon code QR" />
      <View style={styles.body}>
        <View style={styles.card}>
          <QrCode value={qrPayload(user.phone)} size={240} />
          <Text style={styles.name}>
            {user.first_name} {user.last_name}
          </Text>
          <Text style={styles.phone}>{formatPhone(user.phone)}</Text>
        </View>
        <Text style={styles.hint}>
          Fais scanner ce code par un autre compte WAVE pour recevoir un transfert, sans avoir à dicter
          ton numéro.
        </Text>
      </View>
      <View style={styles.actions}>
        <Button title="Scanner un code" variant="secondary" onPress={() => router.replace("/scan")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.primary },
  body: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  name: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  phone: { color: colors.textMuted, marginTop: spacing.xs },
  hint: { color: colors.white, textAlign: "center", marginTop: spacing.lg, fontSize: 15 },
  actions: { padding: spacing.lg },
});
