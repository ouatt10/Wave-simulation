import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import AmountDisplay from "@/components/AmountDisplay";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import RecipientCard from "@/components/RecipientCard";
import Screen from "@/components/Screen";
import { computeFee, MAX_AMOUNT, MIN_AMOUNT, TRANSFER_FEE_PERCENT } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/utils/format";

export default function TransferAmountScreen() {
  const { phone, name } = useLocalSearchParams();
  const { user } = useAuth();
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);

  if (!user) return null; // pendant la déconnexion, avant la redirection

  const amount = Number(value || 0);
  const fee = computeFee(amount);
  const total = amount + fee;

  const onDigit = (digit) => {
    setError(null);
    setValue((v) => ((v === "" && digit === "0") || v.length >= 7 ? v : v + digit));
  };

  const next = () => {
    if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setError(`Le montant doit être compris entre ${formatAmount(MIN_AMOUNT)} et ${formatAmount(MAX_AMOUNT)}.`);
    } else if (total > user.balance) {
      setError(`Solde insuffisant : il te faut ${formatAmount(total)} (frais compris).`);
    } else {
      router.push({ pathname: "/transfer/confirm", params: { phone, name, amount: String(amount) } });
    }
  };

  return (
    <Screen>
      <Header title="Montant" />
      <View style={styles.body}>
        <RecipientCard name={name} phone={phone} />
        <View style={styles.amount}>
          <AmountDisplay value={value} />
          <Text style={styles.fee}>
            Frais ({TRANSFER_FEE_PERCENT} %) : {formatAmount(fee)} · Total : {formatAmount(total)}
          </Text>
          <Text style={styles.balance}>Solde : {formatAmount(user.balance)}</Text>
        </View>
        <Message>{error}</Message>
      </View>
      <View style={styles.actions}>
        <Button title="Continuer" onPress={next} disabled={!amount} />
      </View>
      <NumericKeypad onDigit={onDigit} onDelete={() => setValue((v) => v.slice(0, -1))} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  amount: { alignItems: "center", marginTop: spacing.xl },
  fee: { color: colors.textMuted, marginTop: spacing.sm },
  balance: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 13 },
  actions: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
});
