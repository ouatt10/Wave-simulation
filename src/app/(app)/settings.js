import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import Avatar from "@/components/Avatar";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import { MAX_AMOUNT, MIN_AMOUNT, TRANSFER_FEE_PERCENT } from "@/constants/rules";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount, formatLocalPhone, formatPhone } from "@/utils/format";

export default function SettingsScreen() {
  const { user, lock, logout, forgetPhone } = useAuth();
  if (!user) return null; // pendant la déconnexion, avant la redirection

  const fullName = `${user.first_name} ${user.last_name}`;

  const confirmChangeAccount = () =>
    Alert.alert(
      "Ajouter un autre compte",
      "Ton numéro sera oublié sur ce téléphone. Tu pourras te connecter ou t'inscrire avec un autre numéro.",
      [
        { text: "Annuler", style: "cancel" },
        { text: "Continuer", style: "destructive", onPress: forgetPhone },
      ],
    );

  const showLimits = () =>
    Alert.alert(
      "Ton plafond",
      `Par opération : de ${formatAmount(MIN_AMOUNT)} à ${formatAmount(MAX_AMOUNT)}.\n` +
        `Frais de transfert : ${TRANSFER_FEE_PERCENT} %, payés par l'expéditeur.\n` +
        "Dépôts gratuits.",
    );

  return (
    <Screen style={styles.screen}>
      <Header title="Paramètres" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.profile]}>
          <Avatar name={fullName} size={56} />
          <View style={styles.profileTexts}>
            <Text style={styles.name} numberOfLines={1}>
              {fullName}
            </Text>
            <Text style={styles.phone}>{formatPhone(user.phone)}</Text>
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={13} color={colors.success} />
              <Text style={styles.badgeText}>Identité vérifiée</Text>
            </View>
          </View>
        </View>

        <Section title="Compte">
          <Row icon="qr-code-outline" label="Mon code QR" onPress={() => router.push("/qr")} />
          <Row icon="person-add-outline" label="Ajouter un autre compte" onPress={confirmChangeAccount} />
        </Section>

        <Section title="Sécurité">
          <Row icon="keypad-outline" label="Modifiez votre code secret" onPress={() => router.push("/change-pin")} />
          <Row icon="lock-closed-outline" label="Verrouiller l'application" onPress={lock} />
        </Section>

        <Section title="Support">
          <Row icon="document-text-outline" label="Vérifiez votre plafond" onPress={showLimits} />
        </Section>

        <View style={[styles.card, styles.lastCard]}>
          <Row
            icon="log-out-outline"
            label="Se déconnecter"
            detail={`(${formatLocalPhone(user.phone)})`}
            onPress={logout}
          />
        </View>

        <Text style={styles.footer}>
          WAVE — simulation pédagogique.{"\n"}Aucun argent réel, aucun lien avec le service Wave.
        </Text>
      </ScrollView>
    </Screen>
  );
}

function Section({ title, children }) {
  return (
    <>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </>
  );
}

function Row({ icon, label, detail, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Ionicons name={icon} size={24} color={colors.text} />
      <Text style={styles.rowLabel} numberOfLines={1}>
        {label}
        {detail ? <Text style={styles.rowDetail}> {detail}</Text> : null}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.page },
  content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  card: { backgroundColor: colors.background, borderRadius: radius.md, paddingVertical: spacing.xs },
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  profileTexts: { flex: 1 },
  name: { fontSize: 18, fontWeight: "800", color: colors.text },
  phone: { color: colors.textMuted, marginTop: 2 },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeText: { color: colors.success, fontWeight: "700", fontSize: 12 },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: "600",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  lastCard: { marginTop: spacing.lg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  pressed: { opacity: 0.5 },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text },
  rowDetail: { color: colors.textMuted },
  footer: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.xl },
});
