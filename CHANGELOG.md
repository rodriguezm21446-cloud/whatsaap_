# Historial de cambios

## 0.2.0 — 2026-10-31

- Ficha verificada de la secadora portátil con bolsa y dimensiones visibles.
- Eliminada la opción de asesor humano del menú de WhatsApp.
- Control privado por número desde Telegram para pausar o reactivar Robotín.
- Gemini clasifica intención y tono; el código responde solo con variables permitidas.
- Aclaración de que secar no equivale a lavar, desinfectar o hacer limpieza profunda.

## 0.1.0 — 2026-10-30

- Creación de la arquitectura inicial en TypeScript.
- Webhooks seguros para WhatsApp y Telegram.
- Modos `BOT`, `WAITING_OWNER` y `HUMAN` por conversación.
- Detección determinista de intención de compra.
- Control `Continuar Robotín` / `Tomar el mando` desde Telegram.
- Base D1, deduplicación de mensajes y cola de notificaciones.
- Primeras pruebas automáticas.
- El aviso a Telegram ocurre únicamente después de que el cliente confirma el resumen previo.

