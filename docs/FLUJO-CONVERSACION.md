# Flujo de conversación inicial

```text
Cliente muestra interés
  → Robotín muestra Consultar costo / Ver detalles / Hacer pedido
  → el texto libre pasa por Gemini para clasificar intención y tono
  → el código responde únicamente con variables verificadas
  → Seguir compra muestra un resumen
  → Sí, continuar pausa solo esa conversación
  → Telegram ofrece Continuar Robotín / Tomar el mando
```

`Me interesa` no se considera una compra. La alerta de Telegram se produce cuando el cliente expresa una intención clara o confirma el resumen previo.

Al iniciar cada número por primera vez, Telegram recibe un control privado con `Pausar este chat` y `Activar Robotín`. El cliente no ve una opción de asesor.

En modo `HUMAN`, Robotín guarda y refleja los mensajes, pero no responde automáticamente.

