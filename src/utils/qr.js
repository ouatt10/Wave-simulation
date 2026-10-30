// Contenu du code QR d'un compte : "wave:+2250700000001".
const PREFIX = "wave:";

export function qrPayload(phone) {
  return `${PREFIX}${phone}`;
}

// Renvoie le numéro contenu dans un code WAVE, ou null pour tout autre code QR.
export function phoneFromQr(data) {
  const match = /^wave:(\+[1-9]\d{7,14})$/.exec(data?.trim() ?? "");
  return match ? match[1] : null;
}
