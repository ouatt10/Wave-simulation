import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/constants/theme";

// Masque le solde dans le sélecteur d'applications (iOS).
export default function PrivacyCover() {
  return (
    <View style={[StyleSheet.absoluteFill, styles.cover]}>
      <Text style={styles.logo}>WAVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cover: { backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  logo: { fontSize: 40, fontWeight: "800", color: colors.white, letterSpacing: 2 },
});
