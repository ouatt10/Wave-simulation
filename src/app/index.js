import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import NumericKeypad from "@/components/NumericKeypad";
import { colors } from "@/constants/theme";

export default function Home() {
  const [value, setValue] = useState("");
  const onDigit = (digit) => {
    setValue((v) => (v.length < 6 ? v + digit : v));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.display}>
        <Text style={styles.value}>{value || "—"}</Text>
      </View>
      <NumericKeypad
        onDigit={onDigit}
        onDelete={() => setValue((v) => v.slice(0, -1))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  display: { flex: 1, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 40, fontWeight: "700", color: colors.text },
});