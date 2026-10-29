import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import { setAuthToken, setSessionLostHandler } from "@/api/client";
import { api } from "@/api/wave";

const PHONE_KEY = "wave.phone";

const AuthContext = createContext(null);

/**
 * Session de l'utilisateur.
 * - Le numéro est mémorisé sur le téléphone (SecureStore) après vérification.
 * - Le token reste en mémoire : dès que l'app passe en arrière-plan, on l'oublie
 *   et on verrouille. Le PIN, vérifié par le backend, redonne un nouveau token.
 */
export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [storedPhone, setStoredPhone] = useState(null);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [locked, setLocked] = useState(false);
  const [hidden, setHidden] = useState(false);

  const userRef = useRef(null);
  const lockSuspended = useRef(false);
  // Brouillon d'inscription : le PIN choisi en attendant sa confirmation.
  const signupDraftRef = useRef({});

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    SecureStore.getItemAsync(PHONE_KEY)
      .then(setStoredPhone)
      .catch(() => setStoredPhone(null))
      .finally(() => setLoading(false));
  }, []);

  const applyToken = useCallback((next) => {
    setAuthToken(next);
    setToken(next);
  }, []);

  const lock = useCallback(() => {
    if (!userRef.current) return;
    applyToken(null);
    setLocked(true);
  }, [applyToken]);

  // Token expiré ou refusé par l'API : on redemande le PIN.
  useEffect(() => {
    setSessionLostHandler(lock);
    return () => setSessionLostHandler(null);
  }, [lock]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setHidden(false);
      } else if (state === "inactive") {
        // iOS (sélecteur d'apps, centre de contrôle) : on masque sans verrouiller.
        setHidden(true);
      } else if (state === "background" && !lockSuspended.current) {
        lock();
      }
    });
    return () => subscription.remove();
  }, [lock]);

  const signIn = useCallback(
    async (phone, accessToken) => {
      applyToken(accessToken);
      try {
        const me = await api.me();
        await SecureStore.setItemAsync(PHONE_KEY, phone);
        setStoredPhone(phone);
        setUser(me);
        setLocked(false);
      } catch (error) {
        applyToken(null);
        throw error;
      }
    },
    [applyToken],
  );

  const login = useCallback(
    async (phone, pin) => {
      const res = await api.login(phone, pin);
      await signIn(phone, res.access_token);
    },
    [signIn],
  );

  const verifyOtp = useCallback(
    async (phone, code) => {
      const res = await api.verifyOtp(phone, code);
      await signIn(phone, res.access_token);
    },
    [signIn],
  );

  const unlock = useCallback(
    async (pin) => {
      const res = await api.login(userRef.current.phone, pin);
      applyToken(res.access_token);
      setLocked(false);
      api.me().then(setUser).catch(() => {});
    },
    [applyToken],
  );

  const refreshUser = useCallback(async () => {
    const me = await api.me();
    setUser(me);
    return me;
  }, []);

  const setBalance = useCallback((balance) => {
    setUser((current) => current && { ...current, balance });
  }, []);

  const logout = useCallback(() => {
    applyToken(null);
    setUser(null);
    setLocked(false);
  }, [applyToken]);

  const forgetPhone = useCallback(async () => {
    await SecureStore.deleteItemAsync(PHONE_KEY);
    setStoredPhone(null);
    logout();
  }, [logout]);

  // Ouvrir l'appareil photo fait passer l'app en arrière-plan :
  // on suspend le verrouillage le temps de l'opération.
  const withoutLock = useCallback(async (fn) => {
    lockSuspended.current = true;
    try {
      return await fn();
    } finally {
      setTimeout(() => {
        lockSuspended.current = false;
      }, 1000);
    }
  }, []);

  let status = "signedOut";
  if (loading) status = "loading";
  else if (user) status = user.kyc_completed ? "ready" : "kyc";

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      storedPhone,
      locked,
      hidden,
      signupDraftRef,
      login,
      verifyOtp,
      unlock,
      lock,
      logout,
      forgetPhone,
      refreshUser,
      setBalance,
      withoutLock,
    }),
    [
      status, user, token, storedPhone, locked, hidden, login, verifyOtp,
      unlock, lock, logout, forgetPhone, refreshUser, setBalance, withoutLock,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return context;
}
