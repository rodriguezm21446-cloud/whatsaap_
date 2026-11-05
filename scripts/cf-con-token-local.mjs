import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const contents = readFileSync("C:/codigo/_cf_token.txt", "utf8");
const match = contents.match(/^api\s*[:=]\s*(.+)$/im);

if (!match?.[1]) {
  throw new Error("No se encontró el token activo de Cloudflare en C:/codigo/_cf_token.txt");
}

const cfEntrypoint = fileURLToPath(new URL("../node_modules/cf/bin/cf", import.meta.url));
const result = spawnSync(process.execPath, [cfEntrypoint, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: {
    ...process.env,
    CLOUDFLARE_API_TOKEN: match[1].trim()
  }
});

if (result.error) {
  console.error(`No se pudo iniciar cf: ${result.error.message}`);
}

process.exit(result.status ?? 1);
