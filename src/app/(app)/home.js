import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CardPattern from "@/components/CardPattern";
import Penguin from "@/components/Penguin";
import QrCode from "@/components/QrCode";
import SimIcon from "@/components/SimIcon";
import TransactionItem from "@/components/TransactionItem";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { useTransactionPages } from "@/hooks/useTransactionPages";
import { groupThousands } from "@/utils/format";
import { qrPayload } from "@/utils/qr";

// La barre de recherche n'apparaît qu'à partir de ce nombre d'opérations.
const SEARCH_MIN_ITEMS = 10;

export default function HomeScreen() {
  const { user, token, refreshUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // null : pas de recherche en cours ; sinon, le texte tapé.
  const [query, setQuery] = useState(null);
  const [search, setSearch] = useState("");

  // On attend 300 ms après la dernière lettre avant d'interroger l'API.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(query?.trim() ?? ""), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const history = useTransactionPages(search);
  const { reload } = history;

  // Recharge à chaque retour sur l'accueil (après un dépôt, un transfert…)
  // et à chaque nouvelle recherche.
  useFocusEffect(
    useCallback(() => {
      if (!token) return; // app verrouillée : on rechargera après le PIN
      refreshUser().catch(() => {});
      reload();
    }, [token, refreshUser, reload]),
  );

  // Texte de la barre d'état en blanc sur le bandeau violet, uniquement ici.
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser().catch(() => {}), reload()]);
    setRefreshing(false);
  };

  if (!user) return null; // pendant la déconnexion, avant la redirection

  const searching = query !== null;
  const canSearch = history.items.length >= SEARCH_MIN_ITEMS || history.hasMore;

  const header = searching ? (
    <View style={[styles.searchHeader, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.searchTitle}>Rechercher dans l&apos;historique</Text>
      <Text style={styles.searchHint}>Nom, numéro, montant, référence ou « dépôt »</Text>
    </View>
  ) : (
    <>
      <View style={[styles.band, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.push("/settings")} hitSlop={12} accessibilityLabel="Paramètres">
            <Ionicons name="settings-sharp" size={24} color={colors.white} />
          </Pressable>
          <View style={styles.account}>
            <SimIcon size={16} color={colors.navy} />
            <Text style={styles.accountText}>{user.phone.slice(-4)}</Text>
          </View>
        </View>

        <Pressable style={styles.balanceRow} onPress={() => setBalanceHidden((h) => !h)}>
          <Text style={styles.balance} adjustsFontSizeToFit numberOfLines={1}>
            {balanceHidden ? (
              "••••••"
            ) : (
              <>
                {groupThousands(user.balance)}
                <Text style={styles.currency}>F</Text>
              </>
            )}
          </Text>
          <Ionicons name={balanceHidden ? "eye-outline" : "eye-off-outline"} size={24} color={colors.white} />
        </Pressable>
      </View>

      <View>
        {/* Fond en deux couches : la carte QR chevauche le bandeau violet et la feuille blanche. */}
        <View style={styles.bandLayer} />
        <View style={styles.sheetLayer} />
        <View style={styles.qrCard}>
          <CardPattern color={colors.qrPattern} background={colors.primary} cornerRadius={radius.lg} />
          <View style={styles.penguin} pointerEvents="none">
            <Penguin size={60} />
          </View>
          <View style={styles.qrBox}>
            <Pressable onPress={() => router.push("/qr")} accessibilityLabel="Afficher mon code QR">
              <QrCode value={qrPayload(user.phone)} size={150} />
            </Pressable>
            <Pressable style={styles.scan} onPress={() => router.push("/scan")} hitSlop={8}>
              <Ionicons name="camera" size={20} color={colors.text} />
              <Text style={styles.scanText}>Scanner</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View>
        <View style={styles.actions}>
          <Action
            icon="person"
            color="#3138C9"
            bg="#E6E8FF"
            label="Transfert"
            onPress={() => router.push("/transfer")}
          />
          <Action
            icon="wallet"
            color="#1F9D55"
            bg="#E3F7EA"
            label="Dépôt"
            onPress={() => router.push("/deposit")}
          />
        </View>
        <View style={styles.divider} />
      </View>
    </>
  );

  let empty = null;
  if (history.loading) {
    empty = <ActivityIndicator color={colors.brand} style={styles.loader} />;
  } else if (searching) {
    empty = <Text style={styles.empty}>Aucune opération ne correspond à ta recherche.</Text>;
  } else {
    empty = <Text style={styles.empty}>Aucune transaction pour l&apos;instant. Commence par un dépôt !</Text>;
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <FlatList
        style={styles.list}
        data={history.items}
        keyExtractor={(tx) => tx.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <TransactionItem tx={item} onPress={() => router.push(`/transaction/${item.id}`)} />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          <View style={styles.footer}>
            {history.loadingMore && <ActivityIndicator color={colors.brand} />}
          </View>
        }
        onEndReached={history.loadMore}
        onEndReachedThreshold={0.4}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          searching ? undefined : (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.white} />
          )
        }
      />

      {searching ? (
        <View style={[styles.searchBar, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.searchField}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher"
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="search"
            />
          </View>
          <Pressable onPress={() => setQuery(null)} hitSlop={8}>
            <Text style={styles.cancel}>Annuler</Text>
          </Pressable>
        </View>
      ) : (
        canSearch && (
          <Pressable
            style={[styles.searchPill, { bottom: insets.bottom + spacing.md }]}
            onPress={() => setQuery("")}
          >
            <Ionicons name="search" size={18} color={colors.white} />
            <Text style={styles.searchPillText}>Rechercher</Text>
          </Pressable>
        )
      )}
    </KeyboardAvoidingView>
  );
}

function Action({ icon, color, bg, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={38} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

// La feuille blanche commence aux deux tiers de la carte QR, comme sur Wave.
const QR_OVERLAP = 160;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  band: { backgroundColor: colors.brand, paddingBottom: spacing.lg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    height: 44,
  },
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.white,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  accountText: { color: colors.navy, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  balance: { color: colors.white, fontSize: 44, fontWeight: "900", flexShrink: 1 },
  currency: { fontSize: 26, fontWeight: "900" },
  bandLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: QR_OVERLAP + 40,
    backgroundColor: colors.brand,
  },
  sheetLayer: {
    position: "absolute",
    top: QR_OVERLAP,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    // Coin gauche plus petit : il doit tenir dans la marge à gauche de la carte QR.
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: 40,
  },
  qrCard: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.lg, // le fond bleu et ses coins arrondis sont dessinés par CardPattern
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  penguin: { position: "absolute", right: spacing.md, bottom: spacing.sm },
  qrBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: "center",
  },
  scan: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  scanText: { fontSize: 16, fontWeight: "600", color: colors.text },
  actions: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  action: { alignItems: "center", gap: spacing.sm, width: 80 },
  pressed: { opacity: 0.7 },
  actionIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  divider: { height: 8, backgroundColor: colors.page },
  item: { paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xl },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  footer: { paddingTop: spacing.md, paddingBottom: 96 },
  searchHeader: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  searchTitle: { fontSize: 22, fontWeight: "800", color: colors.navy },
  searchHint: { color: colors.textMuted, marginTop: spacing.xs },
  searchPill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.full,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  searchPillText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  searchField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.page,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
  },
  searchInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 10 },
  cancel: { color: colors.brand, fontWeight: "700", fontSize: 15 },
});
