import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import CodeInput from "@/components/CodeInput";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import Screen from "@/components/Screen";
import { OTP_LENGTH } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCodeEntry } from "@/hooks/useCodeEntry";
import { useCountdown } from "@/hooks/useCountdown";
import { formatPhone } from "@/utils/format";

export default function OtpScreen() {
  const { phone, resendIn } = useLocalSearchParams();
  const { verifyOtp } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [resendWait, setResendWait] = useCountdown(Number(resendIn) || 60);

  // En cas de succès, la session s'ouvre et la navigation passe au KYC toute seule.
  const entry = useCodeEntry(OTP_LENGTH, async (code, reset) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyOtp(phone, code);
    } catch (err) {
      reset();
      setError(
        err.attemptsRemaining ? `${err.message} Encore ${err.attemptsRemaining} essai(s).` : err.message,
      );
    } finally {
      setBusy(false);
    }
  });

  const resend = async () => {
    setError(null);
    try {
      const res = await api.resendOtp(phone);
      setResendWait(res.resend_in);
      setInfo("Nouveau code envoyé.");
      entry.reset();
    } catch (err) {
      if (err.retryAfter) setResendWait(err.retryAfter);
      setError(err.message);
    }
  };

  return (
    <Screen>
      <Header title="Vérification" />
      <View style={styles.body}>
        <Text style={styles.title}>Vérifie ton numéro</Text>
        <Text style={styles.subtitle}>
          Saisis le code à {OTP_LENGTH} chiffres envoyé par SMS au{"\n"}
          <Text style={styles.phone}>{formatPhone(phone)}</Text>
        </Text>
        <View style={styles.code}>
          <CodeInput length={OTP_LENGTH} value={entry.value} error={!!error} />
        </View>
        {busy && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Message>{error}</Message>
        <Message tone="info">{info}</Message>

        <View style={styles.resend}>
          <Text style={styles.muted}>Tu n&apos;as pas reçu le code ?</Text>
          {resendWait > 0 ? (
            <Text style={styles.muted}>Renvoyer dans {resendWait} s</Text>
          ) : (
            <Pressable onPress={resend} hitSlop={8}>
              <Text style={styles.link}>Renvoyer le code</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.hint}>Simulation : le code s&apos;affiche dans la console du serveur FastAPI.</Text>
      </View>
      <NumericKeypad onDigit={entry.onDigit} onDelete={entry.onDelete} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.md },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  phone: { color: colors.text, fontWeight: "700" },
  code: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.md },
  resend: { alignItems: "center", marginTop: spacing.lg, gap: spacing.xs },
  muted: { color: colors.textMuted },
  link: { color: colors.primaryDark, fontWeight: "700" },
  hint: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: spacing.md },
});
