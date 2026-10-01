# Cambios y puesta en marcha

La portada conserva la tipografía, colores, tamaños y separadores del bloque ATLÁNTICA / & ASOCIADOS / PODER Y ESTRATEGIA. Tras el reporte de que faltaba el logo en celular, se eliminó `hidden sm:flex` y se muestra también por debajo de 640 px. Se comprobó visible y dentro de la portada, sin desbordamiento horizontal, en los cinco tamaños solicitados. La imagen existente es `hero_legal_bg.jpg`, documentos y balanza, aunque la solicitud describe un edificio. La elección entre esa foto y `hero_bg.jpg` está pendiente de confirmación.

## Portada

Archivos: `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`, `frontend/next.config.mjs`.

Se utiliza `cover`, foco por breakpoint, alto mínimo con `svh`, sin altura máxima que recorte el contenido ni fondo fijo. Se conserva el overlay y se aumenta la visibilidad móvil de la foto. Next Image entrega `srcset`/`sizes`, WebP/AVIF según el navegador y precarga mediante `preload`, siguiendo la documentación instalada de Next 16. No se reemplazó el archivo original.

Para probar: `npm.cmd run dev`, abrir la portada a 360×640, 390×844, 768×1024, 1024×768 y 1440×900. También revisar las orientaciones inversas. En Network, comprobar `/_next/image`, Content-Type y la precarga. El encuadre del edificio queda pendiente de la elección del fondo.

## Notificaciones de citas

Archivos: `backend/src/services/appointment-notifications.ts`, `notification-contact.ts`, `cases-store.ts`, `backend/src/templates/appointment-email.ts`, `appointment-whatsapp.ts`, `backend/src/routes/cases.ts`, `backend/src/server.ts`, `backend/.env.example`, `.gitignore`, `backend/tests/appointment-notifications.test.cjs`.

Proveedor de correo: Nodemailer con SMTP, reutilizando las variables existentes. WhatsApp: Cloud API de Meta. No se incluyen credenciales. Copiar y completar `backend/.env.example` en el entorno privado del servidor. Para producción configurar `NOTIFICATIONS_TEST_MODE=false`; usar una cola distinta para pruebas y producción, pues los mensajes de prueba también se marcan como procesados.

Al crear una cita se encolan correo al cliente, WhatsApp al cliente y correo al despacho. Confirmación, cancelación, retorno a pendiente y cambio de hora se notifican después de guardar el cambio. Un estado repetido no crea nuevos mensajes. El admin permite asignar/cambiar hora; no permite cambiar fecha. El formulario y su diseño no se editaron. Sus contactos se normalizan en el backend: correo sin espacios/en minúsculas y teléfono internacional, +506 para ocho dígitos locales.

**Decisión pendiente:** el correo está marcado como opcional en el formulario existente. Si falta, se registra el canal inválido y se envía WhatsApp; no puede garantizarse correo al cliente hasta autorizar que sea requerido al solicitar una cita. El tipo de consulta disponible actualmente es asesoría ciudadana en línea, no existe un campo para seleccionar otro tipo.

### Plantillas de Meta

En WhatsApp Manager, crear una plantilla por cada entrada de `backend/src/templates/appointment-whatsapp.ts`, categoría Utility, idioma español (`es`, o configurar `WHATSAPP_TEMPLATE_LANGUAGE` con el idioma exacto aprobado). Copiar el texto `body` sin cambiar el orden de parámetros. Nombres: `atlantica_cita_creada`, `atlantica_cita_confirmada`, `atlantica_cita_cancelada`, `atlantica_cita_reprogramada`, `atlantica_cita_pendiente`.

Parámetros 1–6: nombre, fecha, hora, tipo de consulta, estado y contacto del despacho. Ejemplo de registro: María Pérez; 5 de octubre de 2026; 09:00; Asesoría ciudadana en línea; confirmada; correo del despacho / teléfono. Esperar aprobación y verificar que los nombres/idiomas coinciden. Configurar `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_API_VERSION` con una versión vigente habilitada en la cuenta. Las plantillas editadas deben volver a registrarse/aprobarse antes de usarlas.

Referencia de Meta: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api

### Cola, reintentos y límites

La cola persiste en `NOTIFICATION_STORE_PATH`; se procesa cada segundo y al iniciar el backend. Cada canal tiene tres intentos totales, con esperas de 5 y 25 segundos. Un fallo no espera en la respuesta HTTP ni impide el otro canal. Tras tres fallos queda `failed`; revisar registros y corregir configuración antes de reactivar deliberadamente ese trabajo. Los registros de error no incluyen tokens ni respuestas completas del proveedor.

Esta cola JSON requiere **un único proceso backend con volumen persistente**. No es apta para múltiples réplicas o disco efímero. La modificación de la cita y la escritura de la cola no son una transacción: una caída justo entre ambos puede perder la notificación. Una caída después de que el proveedor acepte y antes de marcar `sent`, o un timeout ambiguo, puede producir un duplicado al reintentar. Para garantías de producción con varias réplicas se necesita una outbox transaccional en Supabase y coordinación de workers. El resultado `sent` significa aceptación por el proveedor, no entrega leída; no se implementaron webhooks de entrega.

Se corrigió una inserción doble preexistente en Supabase y se conserva el ID persistido en la copia local, para asociar las notificaciones al caso correcto. El temporizador de limpieza de `backend/src/services/rate-limit.ts` usa `unref()` para permitir que el proceso de pruebas termine al cerrar el servidor. Los JSON de casos/publicaciones que ya tenían cambios no se editaron como parte de esta tarea.

### Verificación

`npm.cmd run build` compila backend y frontend. `node --test backend/tests/appointment-notifications.test.cjs` comprueba creación, confirmación repetida, reprogramación, cancelación, normalización, tres intentos, independencia de canales y modo de prueba, con almacenamiento temporal y proveedores simulados. No envía mensajes reales ni cambia los datos del despacho.

Para prueba manual, configurar modo de prueba y una cola de prueba, enviar una solicitud nueva y confirmar/cancelar desde el admin. Revisar mensajes en consola y estados de trabajos. No se verificó entrega real con SMTP, Meta ni persistencia remota en Supabase: faltan credenciales/cuenta de prueba y aprobación de plantillas.

## Responsive

Se revisan las rutas públicas, blog/listado/artículo, contacto/formulario, admin, login y editor nuevo con Edge. Las tablas del admin ya tienen scroll interno. Se añadieron mínimos de 44 px a botones fuera de formularios y enlaces de navegación/agenda; los controles dentro del formulario de casos conservan su diseño. Se actualizó el aviso de cancelación en `AppointmentAgenda.tsx` para explicar el envío automático y evitar pedir un aviso manual previo.

Las capturas y resultados de la inspección están en `.verification/` (ignorado por Git). Se verificaron 96 combinaciones de página/tamaño: todas respondieron 200 y sin scroll horizontal. El menú móvil se abrió y navegó correctamente en los seis tamaños donde se muestra. La agenda y edición de artículos se comprobaron también en 360, 390, 768, 1024 y 1440 px sin desbordes. El optimizador respondió 200 con `image/avif`, `srcset` y `sizes=100vw`. Se ampliaron también los botones del editor, excluyendo por selector el formulario de casos, y el cierre de la sugerencia flotante en `WhatsAppFloatingButton.tsx`. Las interacciones de admin se inspeccionaron sin confirmar, cancelar, eliminar o publicar los registros existentes. Las pruebas HTTP de creación y confirmación usan un servidor y datos temporales separados.
