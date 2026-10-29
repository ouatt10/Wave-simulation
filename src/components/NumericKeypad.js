import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/constants/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "delete"];

export default function NumericKeypad({ onDigit, onDelete, disabled = false }) {
  return (
    <View style={styles.grid}>
      {KEYS.map((key, index) => {
        if (key === "") {
          return <View key={index} style={styles.key} />;
        }
        const isDelete = key === "delete";
        return (
          <Pressable
            key={index}
            disabled={disabled}
            onPress={() => (isDelete ? onDelete() : onDigit(key))}
            style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
            accessibilityLabel={isDelete ? "Effacer" : key}
          >
            <Text style={[styles.keyText, disabled && styles.keyTextDisabled]}>
              {isDelete ? "⌫" : key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.lg,
  },
  key: {
    width: "33.33%",
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
  },
  keyPressed: { backgroundColor: colors.surface },
  keyText: { fontSize: 28, fontWeight: "500", color: colors.text },
  keyTextDisabled: { color: colors.border },
});
