import * as Crypto from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Header from "@/components/Header";
import PinPrompt from "@/components/PinPrompt";
import RecipientCard from "@/components/RecipientCard";
import Screen from "@/components/Screen";
import { computeFee } from "@/constants/rules";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/utils/format";

export default function TransferConfirmScreen() {
  const { phone, name, amount: amountParam } = useLocalSearchParams();
  const { setBalance } = useAuth();
  // Créée une seule fois à l'ouverture de l'écran : si la réponse se perd et
  // qu'on renvoie la demande, le backend reconnaît la clé et ne débite pas deux fois.
  const idempotencyKey = useRef(Crypto.randomUUID());

  const amount = Number(amountParam);
  const fee = computeFee(amount);

  const confirm = async (pin) => {
    const res = await api.transfer({
      toPhone: phone,
      amount,
      pin,
      idempotencyKey: idempotencyKey.current,
    });
    setBalance(res.balance);
    router.replace({ pathname: "/transaction/[id]", params: { id: res.transaction.id, done: "1" } });
  };

  return (
    <Screen>
      <Header title="Confirmation" />
      <PinPrompt
        top={
          <View style={styles.recap}>
            <RecipientCard name={name} phone={phone} />
            <View style={styles.lines}>
              <Line label="Montant envoyé" value={formatAmount(amount)} />
              <Line label="Frais (1 %)" value={formatAmount(fee)} />
              <Line label="Total débité" value={formatAmount(amount + fee)} strong />
            </View>
          </View>
        }
        title="Saisis ton code PIN"
        subtitle="pour confirmer le transfert"
        onSubmit={confirm}
      />
    </Screen>
  );
}

function Line({ label, value, strong = false }) {
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.lineValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  recap: { marginHorizontal: -spacing.lg, marginBottom: spacing.lg },
  lines: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  line: { flexDirection: "row", justifyContent: "space-between" },
  lineLabel: { color: colors.textMuted },
  lineValue: { color: colors.text, fontWeight: "600" },
  strong: { color: colors.text, fontWeight: "800" },
});
