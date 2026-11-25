import * as Crypto from "expo-crypto";
import { router, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Header from "@/components/Header";
import PinPrompt from "@/components/PinPrompt";
import Screen from "@/components/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/utils/format";

export default function WithdrawConfirmScreen() {
  const { amount: amountParam } = useLocalSearchParams();
  const { setBalance } = useAuth();
  // Créée à l'ouverture de CET écran : un retour pour changer le montant donne
  // une nouvelle clé, mais un code faux puis juste réutilise la même.
  const idempotencyKey = useRef(Crypto.randomUUID());

  const amount = Number(amountParam);

  const confirm = async (pin) => {
    const res = await api.withdraw({ amount, pin, idempotencyKey: idempotencyKey.current });
    setBalance(res.balance);
    router.replace({ pathname: "/transaction/[id]", params: { id: res.transaction.id, done: "1" } });
  };

  return (
    <Screen>
      <Header title="Confirmation" />
      <PinPrompt
        top={
          <View style={styles.lines}>
            <Line label="Montant retiré" value={formatAmount(amount)} />
            <Line label="Frais" value={formatAmount(0)} />
            <Line label="Total débité" value={formatAmount(amount)} strong />
          </View>
        }
        title="Saisis ton code PIN"
        subtitle="pour confirmer le retrait"
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
  lines: {
    marginBottom: spacing.lg,
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
