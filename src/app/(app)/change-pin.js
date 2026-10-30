import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import CodeInput from "@/components/CodeInput";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import Screen from "@/components/Screen";
import { isWeakPin, PIN_LENGTH } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useCodeEntry } from "@/hooks/useCodeEntry";
import { formatDuration } from "@/utils/format";

const STEPS = {
  current: { title: "Code secret actuel", subtitle: "Saisis ton code secret actuel." },
  next: { title: "Nouveau code secret", subtitle: `Choisis ${PIN_LENGTH} nouveaux chiffres.` },
  confirm: { title: "Confirme le nouveau code", subtitle: "Saisis-le une deuxième fois." },
};

export default function ChangePinScreen() {
  const [step, setStep] = useState("current");
  const [currentPin, setCurrentPin] = useState(null);
  const [newPin, setNewPin] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const restart = (message) => {
    setCurrentPin(null);
    setNewPin(null);
    setStep("current");
    setError(message);
  };

  const submit = async (pin) => {
    setBusy(true);
    try {
      await api.changePin(currentPin, pin);
      Alert.alert("Code secret modifié", "Utilise ton nouveau code dès maintenant.");
      router.back();
    } catch (err) {
      if (err.code === "account_locked") {
        restart(`Trop d'essais incorrects. Réessaie dans ${formatDuration(err.retryAfter)}.`);
      } else if (err.attemptsRemaining) {
        restart(`Code actuel incorrect. Encore ${err.attemptsRemaining} essai(s) avant blocage.`);
      } else {
        restart(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // Le PIN actuel n'est vérifié qu'à la fin, par le backend (avec le blocage progressif).
  const entry = useCodeEntry(PIN_LENGTH, (pin, reset) => {
    reset();
    setError(null);
    if (step === "current") {
      setCurrentPin(pin);
      setStep("next");
    } else if (step === "next") {
      if (isWeakPin(pin)) {
        setError("Ce code est trop facile à deviner. Choisis-en un autre.");
      } else if (pin === currentPin) {
        setError("Le nouveau code doit être différent de l'ancien.");
      } else {
        setNewPin(pin);
        setStep("confirm");
      }
    } else if (pin !== newPin) {
      setNewPin(null);
      setStep("next");
      setError("Les deux codes ne correspondent pas. Recommence.");
    } else {
      submit(pin);
    }
  });

  const { title, subtitle } = STEPS[step];

  return (
    <Screen>
      <Header title="Code secret" />
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.code}>
          <CodeInput length={PIN_LENGTH} value={entry.value} secure error={!!error} />
        </View>
        {busy && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Message>{error}</Message>
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
});
