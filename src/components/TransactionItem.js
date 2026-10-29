import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";
import { formatAmount, formatDate } from "@/utils/format";

export function describeTransaction(tx) {
  if (tx.type === "deposit") {
    return { title: "Dépôt", icon: "add", tint: colors.success, bg: colors.successLight };
  }
  const name = tx.counterparty?.full_name ?? tx.counterparty?.phone;
  return tx.direction === "out"
    ? { title: `À ${name}`, icon: "arrow-up", tint: colors.primaryDark, bg: colors.primaryLight }
    : { title: `De ${name}`, icon: "arrow-down", tint: colors.success, bg: colors.successLight };
}

// Montant vu par l'utilisateur : ce qui entre (+) ou sort, frais compris (−).
export function signedAmount(tx) {
  return tx.direction === "out"
    ? `−${formatAmount(tx.amount + tx.fee)}`
    : `+${formatAmount(tx.amount)}`;
}

export default function TransactionItem({ tx, onPress }) {
  const { title, icon, tint, bg } = describeTransaction(tx);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.icon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.date}>{formatDate(tx.created_at)}</Text>
      </View>
      <Text style={[styles.amount, tx.direction === "in" && styles.amountIn]}>
        {signedAmount(tx)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  pressed: { opacity: 0.6 },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: colors.text },
  date: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "700", color: colors.text },
  amountIn: { color: colors.success },
});
