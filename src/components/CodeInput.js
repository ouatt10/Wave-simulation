import { StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export default function CodeInput({ length, value, secure = false, error = false }) {
  const boxes = Array.from({ length }, (_, index) => index);

  return (
    <View style={styles.row}>
      {boxes.map((index) => {
        const digit = value[index];
        const isActive = index === value.length;
        return (
          <View
            key={index}
            style={[
              styles.box,
              isActive && styles.boxActive,
              error && styles.boxError,
            ]}
          >
            <Text style={styles.text}>
              {digit === undefined ? "–" : secure ? "●" : digit}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: { borderColor: colors.primary, backgroundColor: colors.white },
  boxError: { borderColor: colors.danger },
  text: { fontSize: 24, fontWeight: "700", color: colors.text },
});
