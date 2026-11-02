import { verifySecret } from "../whatsapp/security.ts";

const encoder = new TextEncoder();

const toBase64 = (bytes: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)));

/**
 * Valida la firma X-Twilio-Signature para cuerpos application/x-www-form-urlencoded.
 * Algoritmo documentado por Twilio: URL completa + parámetros ordenados, HMAC-SHA1.
 */
export async function verifyTwilioSignature(
  requestUrl: string,
  params: URLSearchParams,
  signatureHeader: string | null,
  authToken: string
): Promise<boolean> {
  if (!signatureHeader || !authToken) return false;

  const keys = [...new Set(params.keys())].sort();
  let signedValue = requestUrl;
  for (const key of keys) {
    const values = params.getAll(key).sort();
    for (const value of values) signedValue += `${key}${value}`;
  }

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(authToken),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const expected = toBase64(
    await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(signedValue))
  );
  return verifySecret(signatureHeader, expected);
}
