# Publicar Atlántica & Asociados con Vercel Services

Se importa el repositorio como **un proyecto** con dos servicios:
`frontend` (Next.js) para la web y `backend` (Express) en `/api/*`.
`vercel.json` en la raíz define las rutas, el binding y el cron.
Supabase conserva los datos y documentos privados.

## 1. Preparar Supabase

Ejecutar las migraciones de `backend/supabase/migrations`, de 001 a 006,
en orden. Si el proyecto ya existe, ejecutar solo las pendientes.
Respaldar e importar los datos locales antes del cambio; los JSON no se
importan automáticamente. Importar casos históricos antes de 006 y resolver
reservas activas duplicadas antes de aplicar esa migración.
Crear el administrador siguiendo README.md y mantener privado el bucket
`case-documents`. En Authentication → URL Configuration, establecer
`https://infoatlanticaasociados.com` como Site URL y configurar las
redirecciones de acceso. Usar otro proyecto Supabase para previews/pruebas.
En producción la API requiere Supabase y no utiliza backend/data.

## 2. Importar en Vercel

1. En https://vercel.com/new importar Jimenajr05/atlantica-asociados.
2. Project Name: `atlantica-asociados`.
3. Root Directory: `./` (la raíz del repositorio).
4. Application Preset: **Services**. No elegir Import single project.
5. Node.js: 22.x. Conservar los comandos automáticos por servicio.
6. Configurar las variables antes de Deploy.

El cron se ejecuta cada minuto y requiere un plan que permita esa frecuencia,
como Pro. Usar un plan apto para el uso comercial del sitio.

## 3. Variables del proyecto

| Variable | Valor |
| --- | --- |
| NODE_ENV | production |
| FRONTEND_URL | https://infoatlanticaasociados.com |
| SUPABASE_URL | URL real del proyecto Supabase |
| SUPABASE_SERVICE_ROLE_KEY | Clave privada service role |
| SUPABASE_STORAGE_BUCKET | case-documents |
| RATE_LIMIT_MAX_PER_HOUR | 5 |
| CRON_SECRET | Secreto aleatorio de al menos 32 caracteres |
| NOTIFICATIONS_TEST_MODE | false |
| SMTP_HOST / SMTP_PORT / SMTP_SECURE | Valores del proveedor SMTP |
| SMTP_USER / SMTP_PASS / SMTP_FROM | Credenciales y remitente SMTP |
| NOTIFICATION_EMAIL_TO | infoatlantica.asociados@gmail.com |
| NEXT_PUBLIC_SITE_URL | https://infoatlanticaasociados.com |
| NEXT_PUBLIC_SUPABASE_URL | URL real del mismo proyecto Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Clave pública anon de Supabase |
| NEXT_PUBLIC_WHATSAPP_NUMBER | 50660024545 |
| NEXT_PUBLIC_CONTACT_EMAIL | infoatlantica.asociados@gmail.com |

**No configurar BACKEND_URL manualmente:** Vercel lo inyecta en las funciones
server-side del frontend mediante el binding al backend. No configurar
NEXT_PUBLIC_BACKEND_URL; el navegador llama a `/api/*` en el mismo dominio.
Omitir TRUST_PROXY en Vercel. No poner claves privadas en variables NEXT_PUBLIC_*.
Las variables públicas se incorporan al compilar: volver a desplegar si cambian.

El blog y sitemap consultan la API al recibir una petición, ya que el binding
no existe durante la compilación. Las rutas Express conservan el prefijo /api.
Para desarrollo convencional, npm run dev conserva el proxy local de Next.js;
para probar Services y bindings usar `vercel dev` desde la raíz.

El cron de la raíz llama a /api/internal/notifications con CRON_SECRET.
La cola persiste en Supabase; supervisar notification_jobs. Los fallos se
reintentan hasta tres intentos normales; una entrega aceptada seguida de un
fallo puede generar reenvío. El correo y contacto de las plantillas se definen
en el trigger SQL de 006. Las consultas sin cita esperan el intento SMTP;
si falla, el caso permanece guardado.

WhatsApp requiere plantillas aprobadas y WHATSAPP_API_VERSION,
WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN y WHATSAPP_TEMPLATE_LANGUAGE.
Sin esa configuración, los trabajos de WhatsApp fallarán; revisar la cola.

## 4. Dominio

En Settings → Domains del único proyecto, añadir infoatlanticaasociados.com
 y www.infoatlanticaasociados.com; redirigir www al dominio principal.
Copiar exactamente los registros web que indique Vercel en el proveedor DNS
(Namecheap si administra los nameservers). Conservar los registros MX/TXT
para correo. Esperar verificación y HTTPS. Web y API comparten el dominio.
Deployment Protection debe permitir las peticiones públicas de producción;
las rutas administrativas siguen requiriendo autorización de Supabase.

## 5. Verificación

- Abrir la web y /api/health, comprobar HTTPS y redirección de www.
- Iniciar sesión en /admin/login y probar autorización administrativa.
- Enviar consulta con adjuntos, descargarlos y verificar el máximo total de 4 MB.
- Reservar una cita, revisar correo y notification_jobs.
- Intentar reservas simultáneas: solo una debe reservar esa hora.
- Verificar el límite de consultas y su persistencia tras desplegar de nuevo.
- Crear una publicación y comprobar portada, blog, artículo y sitemap.
- Volver a desplegar y verificar que datos, documentos y cola permanecen.

La preparación local no crea proyectos, configura cuentas ni modifica DNS.

Referencias:
https://vercel.com/docs/services
https://vercel.com/docs/services/bindings
https://vercel.com/docs/services/routing
https://vercel.com/docs/cron-jobs/usage-and-pricing
