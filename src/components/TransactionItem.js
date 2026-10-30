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

// Montant vu par l'utilisateur : ce qui sort, frais compris, est précédé d'un « − ».
export function signedAmount(tx) {
  return tx.direction === "out" ? `−${formatAmount(tx.amount + tx.fee)}` : formatAmount(tx.amount);
}

// Ligne d'historique façon Wave : titre et date à gauche, montant à droite.
export default function TransactionItem({ tx, onPress }) {
  const { title } = describeTransaction(tx);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={styles.texts}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.date}>{formatDate(tx.created_at)}</Text>
      </View>
      <Text style={styles.amount}>{signedAmount(tx)}</Text>
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
  texts: { flex: 1 },
  title: { fontSize: 17, fontWeight: "600", color: colors.navy },
  date: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  amount: { fontSize: 17, fontWeight: "600", color: colors.navy },
});
