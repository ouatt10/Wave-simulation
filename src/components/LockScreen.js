import { useEffect } from "react";
import { BackHandler, Pressable, StyleSheet, Text } from "react-native";

import Avatar from "@/components/Avatar";
import PinPrompt from "@/components/PinPrompt";
import Screen from "@/components/Screen";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

// Affiché PAR-DESSUS la navigation : l'écran en cours (ex. un transfert à moitié
// rempli) est conservé et retrouvé tel quel après le déverrouillage.
export default function LockScreen() {
  const { user, unlock, logout } = useAuth();

  // Le bouton retour d'Android ne doit pas naviguer derrière l'écran verrouillé.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => sub.remove();
  }, []);

  return (
    <Screen style={StyleSheet.absoluteFill}>
      <PinPrompt
        top={<Avatar name={user?.first_name ? `${user.first_name} ${user.last_name}` : user?.phone} size={64} />}
        title={user?.first_name ? `Bonjour ${user.first_name}` : "Bon retour"}
        subtitle="Saisis ton code PIN pour déverrouiller"
        onSubmit={unlock}
        footer={
          <Pressable onPress={logout} style={styles.link}>
            <Text style={styles.linkText}>Se déconnecter</Text>
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
