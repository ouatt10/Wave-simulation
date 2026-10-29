import { COUNTRIES } from "@/constants/countries";

const MONTHS = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

// 1500000 → "1 500 000"
export function groupThousands(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatAmount(amount) {
  return `${groupThousands(amount)} F`;
}

// "0700000001" → "07 00 00 00 01"
export function groupPairs(digits) {
  return digits.replace(/(\d{2})(?=\d)/g, "$1 ");
}

// "+2250700000001" → "+225 07 00 00 00 01"
export function formatPhone(e164) {
  if (!e164) return "";
  const country = COUNTRIES.find((c) => e164.startsWith(c.dial));
  if (!country) return e164;
  return `${country.dial} ${groupPairs(e164.slice(country.dial.length))}`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 330 → "5 min 30 s"
export function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest} s`;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return minutes % 60 ? `${hours} h ${minutes % 60} min` : `${hours} h`;
  }
  return rest ? `${minutes} min ${rest} s` : `${minutes} min`;
}

export function initials(name) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
