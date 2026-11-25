import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AmountDisplay from "@/components/AmountDisplay";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import Screen from "@/components/Screen";
import { MAX_AMOUNT, MIN_AMOUNT } from "@/constants/rules";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount, groupThousands } from "@/utils/format";

const QUICK_AMOUNTS = [1000, 5000, 10000, 50000];

export default function WithdrawScreen() {
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);

  const amount = Number(value || 0);

  const onDigit = (digit) =>
    setValue((v) => (v === "" && digit === "0") || v.length >= 7 ? v : v + digit);

  const submit = () => {
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setError(`Le montant doit être compris entre ${formatAmount(MIN_AMOUNT)} et ${formatAmount(MAX_AMOUNT)}.`);
      return;
    }
    // Confort pour l'utilisateur : le backend revérifie le solde de toute façon.
    if (amount > user.balance) {
      setError("Le montant demandé est supérieur au solde disponible.");
      return;
    }
    setError(null);
    router.push({ pathname: "/withdraw/confirm", params: { amount: String(amount) } });
  };

  return (
    <Screen>
      <Header title="Retrait" />
      <View style={styles.body}>
        <Text style={styles.label}>Montant à retirer</Text>
        <AmountDisplay value={value} />
        <View style={styles.chips}>
          {QUICK_AMOUNTS.map((quick) => (
            <Pressable key={quick} style={styles.chip} onPress={() => setValue(String(quick))}>
              <Text style={styles.chipText}>{groupThousands(quick)}</Text>
            </Pressable>
          ))}
        </View>
        <Message>{error}</Message>
      </View>
      <View style={styles.actions}>
        <Button title="Continuer" onPress={submit} disabled={!amount} />
      </View>
      <NumericKeypad
        onDigit={onDigit}
        onDelete={() => setValue((v) => v.slice(0, -1))}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  label: { textAlign: "center", color: colors.textMuted, marginBottom: spacing.sm },
  chips: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  chip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  chipText: { color: colors.primaryDark, fontWeight: "700" },
  actions: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
