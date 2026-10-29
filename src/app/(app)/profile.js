import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatPhone } from "@/utils/format";

export default function ProfileScreen() {
  const { user, lock, logout, forgetPhone } = useAuth();
  if (!user) return null; // pendant la déconnexion, avant la redirection

  const fullName = `${user.first_name} ${user.last_name}`;

  const confirmChangeAccount = () =>
    Alert.alert(
      "Changer de compte",
      "Ton numéro sera oublié sur ce téléphone. Tu pourras te reconnecter avec un autre numéro.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Continuer", style: "destructive", onPress: forgetPhone },
      ],
    );

  return (
    <Screen>
      <Header title="Profil" />
      <View style={styles.identity}>
        <Avatar name={fullName} size={80} />
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.phone}>{formatPhone(user.phone)}</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark" size={14} color={colors.success} />
          <Text style={styles.badgeText}>Identité vérifiée</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="lock-closed-outline" label="Verrouiller l'app" onPress={lock} />
        <MenuItem icon="log-out-outline" label="Se déconnecter" onPress={logout} />
        <MenuItem icon="swap-horizontal-outline" label="Changer de compte" onPress={confirmChangeAccount} danger />
      </View>

      <Text style={styles.footer}>
        WAVE — simulation pédagogique.{"\n"}Aucun argent réel, aucun lien avec le service Wave.
      </Text>
    </Screen>
  );
}

function MenuItem({ icon, label, onPress, danger = false }) {
  const color = danger ? colors.danger : colors.text;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.itemLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  identity: { alignItems: "center", paddingVertical: spacing.lg },
  name: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: spacing.md },
  phone: { color: colors.textMuted, marginTop: spacing.xs },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginTop: spacing.md,
  },
  badgeText: { color: colors.success, fontWeight: "700", fontSize: 13 },
  menu: {
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  pressed: { opacity: 0.6 },
  itemLabel: { flex: 1, fontSize: 16, fontWeight: "600" },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
    padding: spacing.lg,
  },
});
