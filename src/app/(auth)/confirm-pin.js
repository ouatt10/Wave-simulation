import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Button from "@/components/Button";
import CodeInput from "@/components/CodeInput";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import Screen from "@/components/Screen";
import { PIN_LENGTH } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCodeEntry } from "@/hooks/useCodeEntry";

export default function ConfirmPinScreen() {
  const { phone } = useLocalSearchParams();
  const { signupDraftRef } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [phoneTaken, setPhoneTaken] = useState(false);

  const goToOtp = (resendIn) =>
    router.replace({ pathname: "/otp", params: { phone, resendIn: String(resendIn) } });

  const entry = useCodeEntry(PIN_LENGTH, async (pin, reset) => {
    if (pin !== signupDraftRef.current.pin) {
      reset();
      setError("Les deux codes ne correspondent pas. Réessaie.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.register(phone, pin);
      signupDraftRef.current = {};
      goToOtp(res.resend_in);
    } catch (err) {
      reset();
      if (err.code === "otp_cooldown") {
        // Un code a déjà été envoyé il y a moins d'une minute : on le réutilise.
        goToOtp(err.retryAfter);
      } else {
        setPhoneTaken(err.code === "phone_taken");
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  });

  return (
    <Screen>
      <Header title="Création du compte" />
      <View style={styles.body}>
        <Text style={styles.title}>Confirme ton code secret</Text>
        <Text style={styles.subtitle}>Saisis-le une deuxième fois.</Text>
        <View style={styles.code}>
          <CodeInput length={PIN_LENGTH} value={entry.value} secure error={!!error} />
        </View>
        {busy && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Message>{error}</Message>
        {phoneTaken && (
          <Button
            title="Me connecter"
            variant="secondary"
            style={styles.login}
            onPress={() => router.replace({ pathname: "/login", params: { phone } })}
          />
        )}
      </View>
      <NumericKeypad onDigit={entry.onDigit} onDelete={entry.onDelete} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
  code: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.md },
  login: { marginTop: spacing.md },
});
