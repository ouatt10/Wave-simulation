import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";

import { api } from "@/api/wave";
import Button from "@/components/Button";
import Header from "@/components/Header";
import Message from "@/components/Message";
import Screen from "@/components/Screen";
import { describeTransaction, signedAmount } from "@/components/TransactionItem";
import { colors, radius, spacing } from "@/constants/theme";
import { useAuth } from "@/context/AuthContext";
import { formatAmount, formatDate, formatPhone } from "@/utils/format";

// Détail d'une transaction. Avec done=1, c'est le reçu affiché juste après l'opération.
export default function TransactionScreen() {
  const { id, done } = useLocalSearchParams();
  const { token } = useAuth();
  const [tx, setTx] = useState(null);
  const [error, setError] = useState(null);
  const isReceipt = done === "1";

  useEffect(() => {
    if (!token) return;
    api.transaction(id).then(setTx).catch((err) => setError(err.message));
  }, [id, token]);

  if (!tx) {
    return (
      <Screen>
        <Header title="Transaction" />
        <View style={styles.center}>
          {error ? <Message>{error}</Message> : <ActivityIndicator color={colors.primary} />}
        </View>
      </Screen>
    );
  }

  const { title, icon, tint, bg } = describeTransaction(tx);
  const outgoing = tx.direction === "out";

  return (
    <Screen>
      <Header title={isReceipt ? "Reçu" : "Transaction"} back={!isReceipt} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.icon, { backgroundColor: isReceipt ? colors.successLight : bg }]}>
          <Ionicons
            name={isReceipt ? "checkmark" : icon}
            size={36}
            color={isReceipt ? colors.success : tint}
          />
        </View>
        {isReceipt && (
          <Text style={styles.success}>
            {tx.type === "deposit" ? "Dépôt réussi !" : "Transfert réussi !"}
          </Text>
        )}
        <Text style={styles.amount}>{signedAmount(tx)}</Text>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.card}>
          {tx.counterparty && (
            <Row
              label={outgoing ? "Destinataire" : "Expéditeur"}
              value={`${tx.counterparty.full_name}\n${formatPhone(tx.counterparty.phone)}`}
            />
          )}
          <Row label="Montant" value={formatAmount(tx.amount)} />
          {outgoing && <Row label="Frais" value={formatAmount(tx.fee)} />}
          {outgoing && <Row label="Total débité" value={formatAmount(tx.amount + tx.fee)} />}
          <Row label="Date" value={formatDate(tx.created_at)} />
          <Row label="Référence" value={tx.reference} />
          <Row label="Statut" value="Réussi" />
        </View>
      </ScrollView>
      {isReceipt && (
        <View style={styles.actions}>
          <Button title="Terminer" onPress={() => router.dismissTo("/home")} />
        </View>
      )}
    </Screen>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { alignItems: "center", padding: spacing.lg },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  success: { fontSize: 20, fontWeight: "800", color: colors.success, marginTop: spacing.md },
  amount: { fontSize: 34, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  title: { fontSize: 16, color: colors.textMuted, marginTop: spacing.xs },
  card: {
    alignSelf: "stretch",
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowLabel: { color: colors.textMuted },
  rowValue: { flex: 1, textAlign: "right", color: colors.text, fontWeight: "600" },
  actions: { padding: spacing.lg },
});
