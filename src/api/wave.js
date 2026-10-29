import { request } from "@/api/client";

// Une fonction par route du backend FastAPI.
export const api = {
  register: (phone, pin) =>
    request("/auth/register", { method: "POST", body: { phone, pin }, auth: false }),

  resendOtp: (phone) =>
    request("/auth/otp/resend", { method: "POST", body: { phone }, auth: false }),

  verifyOtp: (phone, code) =>
    request("/auth/otp/verify", { method: "POST", body: { phone, code }, auth: false }),

  login: (phone, pin) =>
    request("/auth/login", { method: "POST", body: { phone, pin }, auth: false }),

  me: () => request("/me"),

  submitKyc: (form) => request("/kyc", { method: "POST", form }),

  // encodeURIComponent : dans une URL, un "+" brut serait lu comme un espace.
  lookup: (phone) => request(`/users/lookup?phone=${encodeURIComponent(phone)}`),

  deposit: (amount, idempotencyKey) =>
    request("/transactions/deposit", {
      method: "POST",
      body: { amount, idempotency_key: idempotencyKey },
    }),

  transfer: ({ toPhone, amount, pin, idempotencyKey }) =>
    request("/transactions/transfer", {
      method: "POST",
      body: { to_phone: toPhone, amount, pin, idempotency_key: idempotencyKey },
    }),

  transactions: ({ limit = 20, cursor } = {}) => {
    const query = `limit=${limit}${cursor ? `&cursor=${cursor}` : ""}`;
    return request(`/transactions?${query}`);
  },

  transaction: (id) => request(`/transactions/${id}`),
};
