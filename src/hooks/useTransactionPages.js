import { useCallback, useRef, useState } from "react";

import { api } from "@/api/wave";

const PAGE_SIZE = 20;

/**
 * Historique paginé par curseur, avec recherche facultative.
 * Si une recherche est relancée avant la réponse précédente, seule la
 * dernière requête a le droit de mettre la liste à jour.
 */
export function useTransactionPages(search) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      const page = await api.transactions({ limit: PAGE_SIZE, q: search });
      if (requestId !== requestIdRef.current) return;
      setItems(page.items);
      setCursor(page.next_cursor);
    } catch {
      // Erreur réseau : on garde la liste affichée, on peut tirer pour réessayer.
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [search]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    const requestId = requestIdRef.current;
    setLoadingMore(true);
    try {
      const page = await api.transactions({ limit: PAGE_SIZE, cursor, q: search });
      if (requestId !== requestIdRef.current) return;
      setItems((current) => [...current, ...page.items]);
      setCursor(page.next_cursor);
    } catch {
      // On réessaiera au prochain défilement.
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, search]);

  return { items, hasMore: cursor !== null, loading, loadingMore, reload, loadMore };
}
