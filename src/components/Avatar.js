import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";
import { initials } from "@/utils/format";

export default function Avatar({ name, size = 48 }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { color: colors.primaryDark, fontWeight: "800" },
});
