import { bindings, defineConfig, triggers } from "cf/config";
import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };

import type { NotificationJob } from "./src/notifications/types.ts";

export default defineConfig({
  worker: {
    name: "bot-whatsaap",
    entrypoint,
    compatibilityDate: "2026-11-02",
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
      TWILIO_AUTH_TOKEN: bindings.secret(),
      META_GRAPH_API_VERSION: bindings.text("CONFIGURAR_ANTES_DE_DESPLEGAR"),
      GEMINI_MODEL: bindings.text("gemini-3.5-flash-lite"),
      BUSINESS_NAME: bindings.text("Novakira"),
      PRODUCT_NAME: bindings.text("Secadora de ropa portátil con bolsa"),
      PRODUCT_PRICE: bindings.text("POR_CONFIGURAR"),
      PRODUCT_FEATURES: bindings.text(
        "Secado con bolsa de aire caliente, diseño ligero y plegable para transportarla y guardarla con facilidad."
      ),
      PRODUCT_SIZE: bindings.text(
        "La unidad principal mide 27 cm de ancho y 19,5 cm de alto según la imagen. La referencia de 10,5 cm aparece en la sección superior, pero falta confirmar qué dimensión representa."
      ),
      PRODUCT_SPECIFICATIONS: bindings.text(
        "Secadora portátil con bolsa de aire caliente; diseño ligero y plegable. Unidad principal de 27 cm de ancho y 19,5 cm de alto según la imagen."
      ),
      PRODUCT_USE_CASES: bindings.text(
        "Ideal para departamentos pequeños, dormitorios, viajes, campamentos o como complemento práctico en casa, especialmente donde no hay secadora convencional."
      ),
      PRODUCT_DELIVERY: bindings.text(
        "El plazo se confirma cuando la empresa transportadora genera el código o guía de seguimiento. Todavía no se promete un tiempo exacto."
      ),
      PRODUCT_WARRANTY: bindings.text("NO_VERIFICADO"),
      PRODUCT_STOCK: bindings.text("NO_VERIFICADO"),
      PRODUCT_USAGE: bindings.text(
        "Se colocan prendas previamente lavadas y húmedas dentro de la bolsa para secarlas con aire caliente. La carga máxima y el procedimiento exacto deben confirmarse con el manual del producto."
      )
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
