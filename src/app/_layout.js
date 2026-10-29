import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import LockScreen from "@/components/LockScreen";
import PrivacyCover from "@/components/PrivacyCover";
import { colors } from "@/constants/theme";
import { AuthProvider, useAuth } from "@/context/AuthContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

/**
 * Chaque groupe d'écrans n'est accessible que dans le bon état :
 *   signedOut → (auth)   kyc → kyc   ready → (app)
 * Quand l'état change, Expo Router renvoie vers "index", qui redirige au bon endroit.
 */
function RootNavigator() {
  const { status, locked, hidden } = useAuth();

  return (
    <View style={styles.root}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={status === "signedOut"}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={status === "kyc"}>
          <Stack.Screen name="kyc" />
        </Stack.Protected>
        <Stack.Protected guard={status === "ready"}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
      {locked && <LockScreen />}
      {hidden && !locked && <PrivacyCover />}
      {status === "loading" && (
        <View style={[StyleSheet.absoluteFill, styles.splash]}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  splash: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
});
