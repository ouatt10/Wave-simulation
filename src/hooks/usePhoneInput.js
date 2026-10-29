import { useCallback, useState } from "react";

import { DEFAULT_COUNTRY } from "@/constants/countries";

// Pays + chiffres du numéro local, saisis au clavier dessiné.
export function usePhoneInput() {
  const [country, setCountryState] = useState(DEFAULT_COUNTRY);
  const [digits, setDigits] = useState("");

  const setCountry = useCallback((next) => {
    setCountryState(next);
    setDigits((d) => d.slice(0, next.length));
  }, []);

  const onDigit = useCallback(
    (digit) => setDigits((d) => (d.length < country.length ? d + digit : d)),
    [country.length],
  );
  const onDelete = useCallback(() => setDigits((d) => d.slice(0, -1)), []);

  return {
    country,
    setCountry,
    digits,
    onDigit,
    onDelete,
    isComplete: digits.length === country.length,
    e164: `${country.dial}${digits}`,
  };
}
