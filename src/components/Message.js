import { StyleSheet, Text } from "react-native";

import { colors, spacing } from "@/constants/theme";

// Ligne d'information sous un champ : erreur (rouge) ou simple aide (gris).
export default function Message({ children, tone = "error" }) {
  if (!children) return null;
  return <Text style={[styles.text, tone === "error" ? styles.error : styles.info]}>{children}</Text>;
}

const styles = StyleSheet.create({
  text: { textAlign: "center", marginTop: spacing.md, paddingHorizontal: spacing.lg },
  error: { color: colors.danger, fontWeight: "600" },
  info: { color: colors.textMuted },
});
