import { StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import { colors, radius, spacing } from "@/constants/theme";
import { formatPhone } from "@/utils/format";

export default function RecipientCard({ name, phone }) {
  return (
    <View style={styles.card}>
      <Avatar name={name} size={44} />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.phone}>{formatPhone(phone)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
  },
  texts: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.text },
  phone: { color: colors.textMuted, marginTop: 2 },
});
