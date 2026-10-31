# Guía de carpetas

| Carpeta | Responsabilidad | Buscar aquí cuando... |
|---|---|---|
| `src/domain` | Reglas y lenguaje de Robotín | clasifica mal una intención o responde de forma fría |
| `src/handlers` | Coordina cada webhook | llega el mensaje pero no ocurre la acción esperada |
| `src/integrations/whatsapp` | Seguridad, lectura y envío por Meta | WhatsApp rechaza o no entrega mensajes |
| `src/integrations/telegram` | Botones y mensajes de Telegram | no aparece una alerta o botón |
| `src/database` | Lectura y escritura en D1 | se pierde el estado de una conversación |
| `src/notifications` | Cola y reintentos | Telegram falla temporalmente |
| `src/utils` | Funciones pequeñas de apoyo | falla el enmascarado u otra transformación |
| `migrations` | Estructura SQL | hay errores de tablas o columnas |
| `test` | Pruebas automáticas | quieres reproducir un fallo sin clientes reales |
| `docs` | Explicación del sistema | necesitas entender o mantener el proyecto |

