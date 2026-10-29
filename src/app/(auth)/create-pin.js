import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import CodeInput from "@/components/CodeInput";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import Screen from "@/components/Screen";
import { isWeakPin, PIN_LENGTH } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useCodeEntry } from "@/hooks/useCodeEntry";

export default function CreatePinScreen() {
  const { phone } = useLocalSearchParams();
  const { signupDraftRef } = useAuth();
  const [error, setError] = useState(null);

  const entry = useCodeEntry(PIN_LENGTH, (pin, reset) => {
    reset();
    if (isWeakPin(pin)) {
      setError("Ce code est trop facile à deviner. Choisis-en un autre.");
      return;
    }
    setError(null);
    // Le PIN reste en mémoire (jamais dans l'URL) jusqu'à sa confirmation.
    signupDraftRef.current = { phone, pin };
    router.push({ pathname: "/confirm-pin", params: { phone } });
  });

  return (
    <Screen>
      <Header title="Création du compte" />
      <View style={styles.body}>
        <Text style={styles.title}>Crée ton code secret</Text>
        <Text style={styles.subtitle}>
          {PIN_LENGTH} chiffres, à ne communiquer à personne. Il te sera demandé à chaque ouverture
          de l&apos;app.
        </Text>
        <View style={styles.code}>
          <CodeInput length={PIN_LENGTH} value={entry.value} secure error={!!error} />
        </View>
        <Message>{error}</Message>
      </View>
      <NumericKeypad onDigit={entry.onDigit} onDelete={entry.onDelete} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
  code: { marginTop: spacing.lg },
});
