import Constants from "expo-constants";

const API_PORT = 8000;

// En développement, Expo connaît l'IP du PC qui fait tourner le serveur Metro
// (ex. "192.168.1.20:8081"). L'API FastAPI tourne sur ce même PC, port 8000.
function guessApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  return host ? `http://${host}:${API_PORT}` : `http://localhost:${API_PORT}`;
}

// EXPO_PUBLIC_API_URL (fichier .env.local) permet de forcer une autre adresse.
export const API_URL = process.env.EXPO_PUBLIC_API_URL || guessApiUrl();
