import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

const META_TOKEN_FILE = "C:/codigo/agi_meta.txt";
const META_DATA_FILE = "C:/codigo/whatsaap_meta.txt";
const GEMINI_FILE = "C:/codigo/Api_de_g.txt";

function valueAfterSeparator(text) {
  const separator = Math.max(text.indexOf(":"), text.indexOf("="));
  return (separator >= 0 ? text.slice(separator + 1) : text).trim();
}

function extractLabeledValue(text, label) {
  const line = text
    .split(/\r?\n/)
    .find((candidate) => candidate.toLowerCase().includes(label));
  if (!line) throw new Error(`No se encontró el campo: ${label}`);
  return valueAfterSeparator(line);
}

function quoteEnv(value) {
  return JSON.stringify(value);
}

const [metaTokenText, metaDataText, geminiText] = await Promise.all([
  readFile(META_TOKEN_FILE, "utf8"),
  readFile(META_DATA_FILE, "utf8"),
  readFile(GEMINI_FILE, "utf8")
]);

const accessToken = valueAfterSeparator(metaTokenText);
const phoneNumberId = metaDataText.match(/\d{10,}/)?.[0];
const appSecret = extractLabeledValue(metaDataText, "clave secreta");
const geminiApiKey = valueAfterSeparator(geminiText);
const verifyToken = randomBytes(32).toString("hex");

if (!accessToken || !phoneNumberId || !appSecret || !geminiApiKey) {
  throw new Error("Falta al menos una credencial requerida.");
}

const output = [
  `META_APP_SECRET=${quoteEnv(appSecret)}`,
  `META_VERIFY_TOKEN=${quoteEnv(verifyToken)}`,
  `WHATSAPP_ACCESS_TOKEN=${quoteEnv(accessToken)}`,
  `WHATSAPP_PHONE_NUMBER_ID=${quoteEnv(phoneNumberId)}`,
  'TELEGRAM_BOT_TOKEN=""',
  'TELEGRAM_CHAT_ID=""',
  'TELEGRAM_OWNER_ID=""',
  'TELEGRAM_WEBHOOK_SECRET=""',
  `GEMINI_API_KEY=${quoteEnv(geminiApiKey)}`,
  'TWILIO_AUTH_TOKEN=""',
  ""
].join("\n");

await writeFile(new URL("../.dev.vars", import.meta.url), output, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx"
});

console.log("Credenciales locales importadas en .dev.vars (valores ocultos).");
