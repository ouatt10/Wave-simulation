import { Redirect, router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import Header from "@/components/Header";
import PinPrompt from "@/components/PinPrompt";
import Screen from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatPhone } from "@/utils/format";

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const { storedPhone, login, forgetPhone } = useAuth();
  const phone = params.phone ?? storedPhone;

  if (!phone) return <Redirect href="/phone" />;

  const changeAccount = async () => {
    if (storedPhone) await forgetPhone();
    router.replace("/phone");
  };

  return (
    <Screen>
      <Header title="" />
      <PinPrompt
        title="Bon retour 👋"
        subtitle={`Saisis ton code PIN pour ${formatPhone(phone)}`}
        onSubmit={(pin) => login(phone, pin)}
        footer={
          <Pressable onPress={changeAccount} style={styles.link}>
            <Text style={styles.linkText}>Ce n&apos;est pas mon compte</Text>
          </Pressable>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { alignSelf: "center", marginTop: spacing.lg, padding: spacing.sm },
  linkText: { color: colors.primaryDark, fontWeight: "700" },
});
