import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Header from "@/components/Header";
import Screen from "@/components/Screen";
import TransactionItem from "@/components/TransactionItem";
import { colors, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 20;

export default function HistoryScreen() {
  const { token } = useAuth();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const showFirstPage = useCallback((page) => {
    setItems(page.items);
    setCursor(page.next_cursor);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    api
      .transactions({ limit: PAGE_SIZE })
      .then((page) => !cancelled && showFirstPage(page))
      .catch(() => {}) // erreur réseau : la liste reste vide, on peut tirer pour réessayer
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, showFirstPage]);

  // Pagination par curseur : on demande la page qui suit la dernière transaction reçue.
  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await api.transactions({ limit: PAGE_SIZE, cursor });
      setItems((current) => [...current, ...page.items]);
      setCursor(page.next_cursor);
    } catch {
      // On réessaiera au prochain défilement.
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      showFirstPage(await api.transactions({ limit: PAGE_SIZE }));
    } catch {
      // Erreur réseau : la liste reste telle quelle.
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen>
      <Header title="Historique" />
      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(tx) => tx.id}
          renderItem={({ item }) => (
            <TransactionItem tx={item} onPress={() => router.push(`/transaction/${item.id}`)} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={refresh}
          ListEmptyComponent={<Text style={styles.empty}>Aucune transaction pour l&apos;instant.</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} /> : null}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  separator: { height: 1, backgroundColor: colors.surface },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
});
