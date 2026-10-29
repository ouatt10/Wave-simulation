import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Avatar from "@/components/Avatar";
import Screen from "@/components/Screen";
import TransactionItem from "@/components/TransactionItem";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount } from "@/utils/format";

export default function HomeScreen() {
  const { user, token, refreshUser } = useAuth();
  const [recent, setRecent] = useState([]);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return; // app verrouillée : on rechargera après le PIN
    try {
      const [, page] = await Promise.all([refreshUser(), api.transactions({ limit: 5 })]);
      setRecent(page.items);
    } catch {
      // Erreur réseau : on garde l'affichage précédent.
    }
  }, [token, refreshUser]);

  // Recharge à chaque retour sur l'accueil (après un dépôt, un transfert…).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (!user) return null; // pendant la déconnexion, avant la redirection

  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <Screen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />}
      >
        <View style={styles.top}>
          <View style={styles.greeting}>
            <Text style={styles.hello}>Bonjour,</Text>
            <Text style={styles.name} numberOfLines={1}>
              {user.first_name}
            </Text>
          </View>
          <Pressable onPress={() => router.push("/profile")} accessibilityLabel="Profil">
            <Avatar name={fullName} size={44} />
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Solde disponible</Text>
          <Pressable style={styles.balanceRow} onPress={() => setBalanceHidden((h) => !h)}>
            <Text style={styles.balance}>{balanceHidden ? "••••••" : formatAmount(user.balance)}</Text>
            <Ionicons
              name={balanceHidden ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.white}
            />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Action icon="add-circle-outline" label="Dépôt" onPress={() => router.push("/deposit")} />
          <Action icon="paper-plane-outline" label="Transfert" onPress={() => router.push("/transfer")} />
          <Action icon="time-outline" label="Historique" onPress={() => router.push("/history")} />
        </View>

        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Dernières transactions</Text>
            {recent.length > 0 && (
              <Pressable onPress={() => router.push("/history")} hitSlop={8}>
                <Text style={styles.seeAll}>Tout voir</Text>
              </Pressable>
            )}
          </View>
          {recent.length === 0 ? (
            <Text style={styles.empty}>Aucune transaction pour l&apos;instant. Commence par un dépôt !</Text>
          ) : (
            recent.map((tx) => (
              <TransactionItem key={tx.id} tx={tx} onPress={() => router.push(`/transaction/${tx.id}`)} />
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Action({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={26} color={colors.primaryDark} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.primary },
  content: { flexGrow: 1 },
  top: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  greeting: { flex: 1 },
  hello: { color: colors.white, opacity: 0.85, fontSize: 15 },
  name: { color: colors.white, fontSize: 22, fontWeight: "800" },
  balanceCard: { alignItems: "center", paddingVertical: spacing.xl },
  balanceLabel: { color: colors.white, opacity: 0.85, fontSize: 14 },
  balanceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.xs },
  balance: { color: colors.white, fontSize: 38, fontWeight: "800" },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  action: { alignItems: "center", gap: spacing.xs },
  pressed: { opacity: 0.7 },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: colors.white, fontWeight: "700" },
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.text },
  seeAll: { color: colors.primaryDark, fontWeight: "700" },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
