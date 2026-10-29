import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import PhoneField from "@/components/PhoneField";
import Screen from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { usePhoneInput } from "@/hooks/usePhoneInput";

export default function TransferRecipientScreen() {
  const phone = usePhoneInput();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const next = async () => {
    setBusy(true);
    setError(null);
    try {
      // Vérifie que le destinataire existe et récupère son nom.
      const recipient = await api.lookup(phone.e164);
      router.push({
        pathname: "/transfer/amount",
        params: { phone: recipient.phone, name: recipient.full_name },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onDigit = (digit) => {
    setError(null);
    phone.onDigit(digit);
  };

  return (
    <Screen>
      <Header title="Transfert" />
      <View style={styles.body}>
        <Text style={styles.title}>À qui veux-tu envoyer de l&apos;argent ?</Text>
        <View style={styles.field}>
          <PhoneField phone={phone} />
        </View>
        <Message>{error}</Message>
      </View>
      <View style={styles.actions}>
        <Button title="Continuer" onPress={next} loading={busy} disabled={!phone.isComplete} />
      </View>
      <NumericKeypad onDigit={onDigit} onDelete={phone.onDelete} disabled={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
  field: { marginTop: spacing.lg },
  actions: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
