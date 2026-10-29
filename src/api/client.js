import { API_URL } from "@/api/config";

const TIMEOUT_MS = 15_000;
const SESSION_ERRORS = ["token_expired", "invalid_token", "not_authenticated"];

// Le token vit uniquement en mémoire : il disparaît quand l'app est fermée.
let authToken = null;
let onSessionLost = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setSessionLostHandler(handler) {
  onSessionLost = handler;
}

// Erreur renvoyée par l'API : {"error": {"code", "message", ...}}.
export class ApiError extends Error {
  constructor(status, error) {
    super(error.message);
    this.status = status;
    this.code = error.code;
    this.fields = error.fields ?? {};
    this.retryAfter = error.retry_after;
    this.attemptsRemaining = error.attempts_remaining;
  }
}

const NETWORK_ERROR = {
  code: "network",
  message: "Impossible de joindre le serveur. Vérifie ta connexion.",
};

export async function request(path, { method = "GET", body, form, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (auth && authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload;
  if (form) {
    payload = form; // fetch ajoute lui-même le Content-Type multipart
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR);
  } finally {
    clearTimeout(timeout);
  }

  const data = await res.json().catch(() => null);
  if (res.ok) return data;

  const error = new ApiError(
    res.status,
    data?.error ?? { code: "unknown", message: "Une erreur est survenue. Réessaie." },
  );
  if (auth && res.status === 401 && SESSION_ERRORS.includes(error.code)) {
    onSessionLost?.();
  }
  throw error;
}
