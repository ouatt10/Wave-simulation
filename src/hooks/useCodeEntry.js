import { useCallback, useEffect, useRef, useState } from "react";

// Saisie d'un code au clavier dessiné. Appelle onComplete(code, reset)
// dès que le code atteint la longueur voulue.
export function useCodeEntry(length, onComplete) {
  const [value, setValue] = useState("");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const reset = useCallback(() => setValue(""), []);

  useEffect(() => {
    if (value.length === length) onCompleteRef.current(value, reset);
  }, [value, length, reset]);

  const onDigit = useCallback(
    (digit) => setValue((v) => (v.length < length ? v + digit : v)),
    [length],
  );
  const onDelete = useCallback(() => setValue((v) => v.slice(0, -1)), []);

  return { value, onDigit, onDelete, reset };
}
