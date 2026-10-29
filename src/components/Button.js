import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

export default function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
}) {
  const inactive = disabled || loading;
  const isPrimary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && styles.pressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.white : colors.primaryDark} />
      ) : (
        <Text style={[styles.text, isPrimary ? styles.textPrimary : styles.textOther]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  ghost: { backgroundColor: "transparent" },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  text: { fontSize: 16, fontWeight: "700" },
  textPrimary: { color: colors.white },
  textOther: { color: colors.primaryDark },
});
