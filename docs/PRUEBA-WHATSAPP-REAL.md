# Prueba real de Robotín con Twilio Sandbox

Esta etapa prueba la conversación desde WhatsApp sin conectar el número comercial de Novakira.

## Arquitectura

```text
WhatsApp personal → Twilio Sandbox → /webhooks/twilio → Robotín → TwiML → WhatsApp
```

El endpoint valida `X-Twilio-Signature` con `TWILIO_AUTH_TOKEN`. La clave se guarda como secreto y nunca se publica.

## Alcance

- Prueba mensajes reales enviados desde WhatsApp.
- Prueba reglas locales, clasificación de Gemini, precio, detalles y precompra.
- Los botones se representan como comandos: `COSTO`, `DETALLES`, `COMPRAR`, `CONFIRMAR`, `DUDA` y `CANCELAR`.
- No registra pedidos ni datos personales durante esta etapa.
- No sustituye la integración oficial de producción con el número de Novakira.

## Consumo de Gemini

Saludos, precio, detalles, funcionamiento y compra se resuelven localmente sin tokens. Gemini se consulta únicamente cuando el clasificador local devuelve una pregunta desconocida; recibe solo el mensaje actual y responde con una categoría corta.

## Configuración en Twilio

1. Crear una cuenta de prueba en Twilio.
2. Abrir **Messaging → Try out WhatsApp**.
3. Escanear el QR o enviar el mensaje `join ...` indicado por Twilio.
4. Seleccionar respuesta **Custom**.
5. Configurar como webhook `https://URL-DEL-WORKER/webhooks/twilio` con método `POST`.
6. Guardar el Auth Token de Twilio como secreto `TWILIO_AUTH_TOKEN` en Cloudflare.

No pegar el Auth Token en documentación, GitHub ni conversaciones.
