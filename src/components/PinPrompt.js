import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import CodeInput from "@/components/CodeInput";
import Message from "@/components/Message";
import NumericKeypad from "@/components/NumericKeypad";
import { PIN_LENGTH } from "@/constants/rules";
import { colors, spacing } from "@/constants/theme";
import { useCodeEntry } from "@/hooks/useCodeEntry";
import { useCountdown } from "@/hooks/useCountdown";
import { formatDuration } from "@/utils/format";

/**
 * Saisie d'un PIN vérifié par le backend (connexion, déverrouillage, transfert).
 * `onSubmit(pin)` lève une ApiError en cas d'échec : on affiche le message,
 * les essais restants, ou le compte à rebours du blocage progressif.
 */
export default function PinPrompt({ title, subtitle, onSubmit, top = null, footer = null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [lockedFor, setLockedFor] = useCountdown();

  const entry = useCodeEntry(PIN_LENGTH, async (pin, reset) => {
    setBusy(true);
    setError(null);
    try {
      await onSubmit(pin);
    } catch (err) {
      reset();
      if (err.code === "account_locked") {
        setLockedFor(err.retryAfter);
      } else if (err.attemptsRemaining) {
        setError(`${err.message} Encore ${err.attemptsRemaining} essai(s) avant blocage.`);
      } else {
        setError(err.message);
      }
    } finally {
      setBusy(false);
    }
  });

  const blocked = lockedFor > 0;

  return (
    <View style={styles.container}>
      <View style={styles.body}>
        {top}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.code}>
          <CodeInput length={PIN_LENGTH} value={entry.value} secure error={!!error || blocked} />
        </View>
        {busy && <ActivityIndicator color={colors.primary} style={styles.spinner} />}
        <Message>
          {blocked ? `Trop d'essais incorrects. Réessaie dans ${formatDuration(lockedFor)}.` : error}
        </Message>
        {footer}
      </View>
      <NumericKeypad onDigit={entry.onDigit} onDelete={entry.onDelete} disabled={busy || blocked} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: spacing.md },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  title: { fontSize: 24, fontWeight: "800", color: colors.text, textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", marginTop: spacing.sm },
  code: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.md },
});
