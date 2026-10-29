import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";
import { groupThousands } from "@/utils/format";

export default function AmountDisplay({ value }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.amount, !value && styles.empty]}>
        {value ? groupThousands(value) : "0"}
      </Text>
      <Text style={styles.currency}>F</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: spacing.sm },
  amount: { fontSize: 48, fontWeight: "800", color: colors.text },
  empty: { color: colors.border },
  currency: { fontSize: 24, fontWeight: "700", color: colors.textMuted },
});
