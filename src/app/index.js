import { Redirect } from "expo-router";

import { useAuth } from "@/context/AuthContext";

// Point d'entrée : envoie l'utilisateur vers le bon écran selon son état.
export default function Index() {
  const { status, storedPhone } = useAuth();

  if (status === "loading") return null; // on attend de savoir si un numéro est mémorisé
  if (status === "ready") return <Redirect href="/home" />;
  if (status === "kyc") return <Redirect href="/kyc" />;
  return <Redirect href={storedPhone ? "/login" : "/phone"} />;
}
