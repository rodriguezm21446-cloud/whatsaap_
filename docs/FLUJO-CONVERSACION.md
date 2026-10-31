# Flujo de conversación inicial

```text
Cliente muestra interés
  → Robotín muestra Consultar costo / Especificaciones / Asesor humano
  → precio o especificaciones termina en Hacer pedido / Seguir consultando / Asesor humano
  → Seguir compra muestra un resumen
  → Sí, continuar pausa solo esa conversación
  → Telegram ofrece Continuar Robotín / Tomar el mando
```

`Me interesa` no se considera una compra. La alerta de Telegram se produce cuando el cliente expresa una intención clara o confirma el resumen previo.

Si el cliente elige `Asesor humano`, Robotín avisa a Telegram con el número, pausa únicamente ese chat y permite reanudar el bot desde Telegram.

En modo `HUMAN`, Robotín guarda y refleja los mensajes, pero no responde automáticamente.

