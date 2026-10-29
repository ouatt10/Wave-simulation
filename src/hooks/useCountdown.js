import { useEffect, useState } from "react";

// Compte à rebours en secondes : [restant, démarrer(secondes)].
export function useCountdown(initial = 0) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    if (remaining <= 0) return undefined;
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  return [remaining, setRemaining];
}
