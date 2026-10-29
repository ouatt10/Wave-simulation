// Mêmes règles que backend/app/core/rules.py. Le backend reste la référence :
// ici, elles servent seulement à guider l'utilisateur avant l'envoi.
export const PIN_LENGTH = 4;
export const OTP_LENGTH = 6;

export const MIN_AMOUNT = 100;
export const MAX_AMOUNT = 1_500_000;
export const TRANSFER_FEE_PERCENT = 1;

// 1 % arrondi au franc supérieur, en restant en nombres entiers.
export function computeFee(amount) {
  return Math.floor((amount * TRANSFER_FEE_PERCENT + 99) / 100);
}

const WEAK_PINS = ["1234", "4321", "0123", "1212", "2580"];

export function isWeakPin(pin) {
  return WEAK_PINS.includes(pin) || /^(\d)\1+$/.test(pin);
}
