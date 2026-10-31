# Pruebas de Bot Whatsaap

Las primeras pruebas se realizan sin conectar el número real ni usar credenciales de producción.

## Prueba automática segura

Desde la carpeta del proyecto:

```powershell
npm test
npm run typecheck
npm run build
```

Estas comprobaciones validan la clasificación de mensajes, las respuestas, la privacidad, el límite de los webhooks y la compilación del Worker.

## Conversar con Robotín sin conectar WhatsApp

```powershell
npm run simular
```

Escribir mensajes como `Hola`, `Me interesa`, `¿cuánto cuesta?` o `quiero comprar`. El simulador no usa Internet, no guarda el chat y no necesita claves. Para finalizar, escribir `salir`.

Para probar temporalmente un precio sin modificar archivos:

```powershell
$env:ROBOTIN_TEST_PRICE="49.99"
npm run simular
```

## Prueba local del webhook

1. Copiar `.dev.vars.example` como `.dev.vars`.
2. Utilizar exclusivamente credenciales de prueba de Meta y Telegram.
3. Generar los tipos con `npm run types`.
4. Aplicar `migrations/0001_initial.sql` a la base D1 local.
5. Iniciar el Worker con `npm run dev`.
6. Probar `/health`; debe responder solamente `{ "ok": true }`.

No debe conectarse el número comercial hasta terminar las pruebas de conversación, privacidad y toma de control.

## Prueba controlada con WhatsApp

Cuando Meta y Telegram estén configurados, usar primero los números de prueba de WhatsApp Cloud API. Verificar este recorrido:

1. El cliente escribe `Hola, me interesa`.
2. Robotín ofrece costo, especificaciones o asesor humano, siempre en ese orden.
3. Al elegir comprar, Robotín muestra precio y pago contra entrega antes de pedir datos.
4. Solo después de confirmar, Telegram recibe la decisión.
5. `Tomar el mando` silencia a Robotín únicamente en ese chat.
6. Un webhook sin firma válida recibe `401` y uno demasiado grande recibe `413`.

Nunca usar clientes reales, cédulas, direcciones ni ubicaciones durante esta etapa.
