import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

import type { NotificationJob } from "./src/notifications/types.ts";

export default defineConfig({
  worker: {
    name: "bot-whatsaap",
    entrypoint,
    compatibilityDate: "2026-10-30",
    compatibilityFlags: ["nodejs_compat"],
    workersDev: true,
    previewUrls: true,
    observability: {
      enabled: true,
      redactQueryString: true,
      logs: {
        enabled: true,
        headSamplingRate: 1,
        invocationLogs: true
      },
      traces: {
        enabled: true,
        headSamplingRate: 0.05
      }
    },
    env: {
      DB: bindings.d1({ name: "bot-whatsaap-db" }),
      NOTIFICATIONS: bindings.queue<NotificationJob>({ name: "bot-whatsaap-notifications" }),
      META_APP_SECRET: bindings.secret(),
      META_VERIFY_TOKEN: bindings.secret(),
      WHATSAPP_ACCESS_TOKEN: bindings.secret(),
      WHATSAPP_PHONE_NUMBER_ID: bindings.secret(),
      TELEGRAM_BOT_TOKEN: bindings.secret(),
      TELEGRAM_CHAT_ID: bindings.secret(),
      TELEGRAM_OWNER_ID: bindings.secret(),
      TELEGRAM_WEBHOOK_SECRET: bindings.secret(),
      GEMINI_API_KEY: bindings.secret(),
      META_GRAPH_API_VERSION: bindings.text("CONFIGURAR_ANTES_DE_DESPLEGAR"),
      GEMINI_MODEL: bindings.text("gemini-3.5-flash-lite"),
      PRODUCT_NAME: bindings.text("Secadora portátil"),
      PRODUCT_PRICE: bindings.text("POR_CONFIGURAR"),
      PRODUCT_SPECIFICATIONS: bindings.text("NO_VERIFICADO"),
      PRODUCT_DELIVERY: bindings.text("NO_VERIFICADO"),
      PRODUCT_WARRANTY: bindings.text("NO_VERIFICADO"),
      PRODUCT_STOCK: bindings.text("NO_VERIFICADO"),
      PRODUCT_USAGE: bindings.text("NO_VERIFICADO")
    },
    triggers: [
      triggers.queue({
        name: "bot-whatsaap-notifications",
        maxBatchSize: 10,
        maxRetries: 3,
        retryDelay: 10,
        deadLetterQueue: "bot-whatsaap-notifications-dead-letter"
      })
    ]
  }
});
