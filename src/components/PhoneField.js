import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { COUNTRIES } from "@/constants/countries";
import { colors, radius, spacing } from "@/constants/theme";
import { groupPairs } from "@/utils/format";

// Affiche "🇨🇮 +225 ▾ | 07 00 00 00 01". Les chiffres viennent du clavier dessiné.
export default function PhoneField({ phone }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const { country, digits, setCountry } = phone;
  const placeholder = groupPairs("0".repeat(country.length));

  return (
    <View style={styles.row}>
      <Pressable style={styles.country} onPress={() => setPickerOpen(true)}>
        <Text style={styles.flag}>{country.flag}</Text>
        <Text style={styles.dial}>{country.dial}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      <Text style={[styles.number, !digits && styles.placeholder]}>
        {digits ? groupPairs(digits) : placeholder}
      </Text>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choisis ton pays</Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <Pressable
                style={styles.countryRow}
                onPress={() => {
                  setCountry(item);
                  setPickerOpen(false);
                }}
              >
                <Text style={styles.flag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.dialMuted}>{item.dial}</Text>
                {item.code === country.code && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radius.md,
    marginHorizontal: spacing.lg,
    height: 60,
    overflow: "hidden",
  },
  country: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    height: "100%",
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  flag: { fontSize: 22 },
  dial: { fontSize: 16, fontWeight: "600", color: colors.text },
  number: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: 1,
    color: colors.text,
    paddingHorizontal: spacing.md,
  },
  placeholder: { color: colors.border },
  modal: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: colors.text },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  countryName: { flex: 1, fontSize: 16, color: colors.text },
  dialMuted: { fontSize: 16, color: colors.textMuted },
});
