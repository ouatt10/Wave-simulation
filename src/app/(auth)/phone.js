import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import Button from "@/components/Button";
import NumericKeypad from "@/components/NumericKeypad";
import PhoneField from "@/components/PhoneField";
import Screen from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { usePhoneInput } from "@/hooks/usePhoneInput";

export default function PhoneScreen() {
  const phone = usePhoneInput();

  const go = (pathname) => router.push({ pathname, params: { phone: phone.e164 } });

  return (
    <Screen>
      <View style={styles.body}>
        <Text style={styles.logo}>WAVE</Text>
        <Text style={styles.title}>Entre ton numéro de téléphone</Text>
        <Text style={styles.subtitle}>Il servira à te connecter et à recevoir de l&apos;argent.</Text>
        <View style={styles.field}>
          <PhoneField phone={phone} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button title="Créer mon compte" onPress={() => go("/create-pin")} disabled={!phone.isComplete} />
        <Button
          title="J'ai déjà un compte"
          variant="ghost"
          onPress={() => go("/login")}
          disabled={!phone.isComplete}
        />
      </View>
      <NumericKeypad onDigit={phone.onDigit} onDelete={phone.onDelete} />
      <Text style={styles.disclaimer}>Simulation pédagogique · aucun argent réel</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, justifyContent: "center" },
  logo: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
    letterSpacing: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  field: { marginTop: spacing.lg },
  actions: { paddingHorizontal: spacing.lg, gap: spacing.xs, marginBottom: spacing.sm },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
});
