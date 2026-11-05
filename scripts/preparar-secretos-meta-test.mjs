import { readFile, writeFile } from "node:fs/promises";

const allowed = new Set([
  "META_APP_SECRET",
  "META_VERIFY_TOKEN",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "GEMINI_API_KEY"
]);

const source = await readFile(new URL("../.dev.vars", import.meta.url), "utf8");
const output = source
  .split(/\r?\n/)
  .filter((line) => allowed.has(line.split("=", 1)[0]))
  .join("\n");

await writeFile(new URL("../meta-test/.dev.vars", import.meta.url), `${output}\n`, {
  encoding: "utf8",
  mode: 0o600,
  flag: "wx"
});

console.log("Secretos mínimos preparados para la prueba de Meta (valores ocultos).");
