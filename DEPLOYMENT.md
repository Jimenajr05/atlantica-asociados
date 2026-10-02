# Publicar con web estática + Supabase

La web se genera en `frontend/out`: no necesita un servidor Next.js.
Render la aloja como Static Site. Supabase conserva usuarios, casos, citas,
blog, archivos privados y cola de notificaciones. La API existente se ejecuta
bajo demanda en una Edge Function; no necesita un servidor Express permanente.

## 1. Base de datos

Conservar el proyecto Supabase existente y todos sus datos.
Aplicar únicamente las migraciones pendientes de `backend/supabase/migrations`
en orden: 001 a 006 y la nueva **007_static_supabase_cron.sql**.
No repetir migraciones ya ejecutadas. Antes de 006, importar los casos históricos
si existen y resolver citas activas duplicadas. Mantener privado case-documents.
La migración 007 programa las notificaciones cada minuto y revisa cambios del
blog para solicitar una reconstrucción estática cada cinco minutos.

El usuario infoatlantica.asociados@gmail.com debe existir en Authentication,
tener correo confirmado y profiles.role = 'admin'. Si lo borraste y recreaste,
asigna el rol al nuevo UUID. El login utiliza su contraseña de Authentication;
las claves API y la contraseña de aplicación de Gmail no sirven para ingresar.

## 2. Secretos: separarlos de la web

Se prepararon dos archivos locales ignorados por Git:

- `.env.static.local`: SOLO variables NEXT_PUBLIC_*; importar en Render.
- `.env.supabase.local`: SMTP, CRON_SECRET y configuración privada; importar
  en Supabase Edge Function Secrets. No importar este archivo en Render.

`.env.vercel.local` es la configuración anterior; no utilizarla para esta web
estática. Si cambias valores, actualiza el archivo nuevo correspondiente.
Supabase inyecta SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY automáticamente en
sus funciones; no hay que copiarlos a la web ni configurarlos con la CLI.
Configurar también NODE_ENV=production y ATLANTICA_EDGE=1 como secretos de la
función. El entorno alojado no permite modificar variables durante el arranque.
Las claves privadas que se hayan compartido deben revocarse antes de publicar.

La web requiere NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y
NEXT_PUBLIC_SITE_URL. Usar el mismo proyecto Supabase en las dos primeras.
También admite NEXT_PUBLIC_WHATSAPP_NUMBER y NEXT_PUBLIC_CONTACT_EMAIL.
Estas variables se incorporan al compilar; redeploy después de cambiarlas.

## 3. Publicar la función de Supabase

Desde la raíz del repositorio, en PowerShell:

```powershell
npm.cmd run build:edge
npx.cmd supabase login
npx.cmd supabase secrets set --env-file .env.supabase.local --project-ref TU_PROJECT_REF
npx.cmd supabase functions deploy atlantica-api --project-ref TU_PROJECT_REF
```

TU_PROJECT_REF es el identificador en https://TU_PROJECT_REF.supabase.co.
El login de la CLI es de tu cuenta Supabase, no del administrador de la página.
`build:edge` genera módulos compatibles con Deno desde backend/src; no copies
las claves al código. Volver a generarlos antes de desplegar cambios en la API.

`supabase/config.toml` desactiva la comprobación global de JWT porque el formulario
público es anónimo. Las rutas administrativas validan explícitamente el token,
el correo autorizado y el rol admin. El cron requiere CRON_SECRET.
Los archivos no pueden leerse sin autorización; se descargan con URL firmada.
Se mantienen validación de documentos, honeypot, límite compartido por IP y
restricción contra citas simultáneas en la base de datos.

Comprobar:
https://TU_PROJECT_REF.supabase.co/functions/v1/atlantica-api/api/health

El SMTP configurado en Edge Secrets es para consultas/citas; el SMTP de Supabase
Authentication es una configuración distinta. WhatsApp automático sigue
requiriendo credenciales de Meta y plantillas aprobadas, igual que antes.

## 4. Activar las notificaciones

En Supabase Vault crear estos secretos (panel Vault o SQL Editor):

| Nombre en Vault | Valor |
| --- | --- |
| atlantica_project_url | URL pública del proyecto Supabase |
| atlantica_cron_secret | El mismo CRON_SECRET de Edge Function Secrets |

La migración 007 invoca la función cada minuto cuando hay trabajos pendientes.
No requiere Vercel Pro. Supervisar notification_jobs y los logs de la función.
Los errores se reintentan y pueden terminar en failed. La entrega SMTP no es
exactamente una vez: un fallo posterior a la aceptación puede causar reenvío.

## 5. Publicar la web en Render

En Render elegir New → Static Site, conectar GitHub e importar
Jimenajr05/atlantica-asociados. Configurar:

| Campo | Valor |
| --- | --- |
| Branch | main |
| Root Directory | frontend |
| Build Command | npm ci --include=dev && npm run build |
| Publish Directory | out |
| Node.js | 22 |

Importar SOLO `.env.static.local` en Environment. No crear Web Service ni
instancias Starter. También se puede importar render.yaml como Blueprint;
este define únicamente un Static Site. El hosting estático tiene límites de
bandwidth/builds: comprobar el plan y consumos antes de confirmar.

Añadir en Redirects/Rewrites una regla Rewrite:
`/blog/*` → `/blog/article/index.html`.
Render sirve primero los archivos que existen: los artículos exportados
conservan su HTML y metadatos; los nuevos usan una página que los consulta en vivo.
Usar la URL onrender.com para probar antes de cambiar el dominio.
En los secretos de la función, configurar FRONTEND_URL con ambos orígenes,
separados por coma: `https://infoatlanticaasociados.com,https://TU-SITIO.onrender.com`.
Actualizar ese secreto después de conocer la URL asignada por Render.

## 6. Actualización del blog y SEO

El blog y la portada actualizan la lista desde Supabase al abrir la página.
Los artículos tienen una vista en vivo inmediata con contenido sanitizado.
Para generar HTML, metadatos y sitemap de publicaciones nuevas, conectar
el Deploy Hook del Static Site de Render como secreto **atlantica_deploy_hook**
en Supabase Vault. La migración 007 agrupa cambios y llama al hook cada cinco
minutos si hay cambios pendientes. Si falta ese secreto, el contenido se ve en
el navegador pero el HTML y sitemap no se actualizan hasta un deploy manual.

Supervisar los despliegues de Render: que el hook sea aceptado no garantiza
que la compilación termine correctamente. Un fallo mantiene la versión anterior;
corregirlo y desplegar de nuevo. La vista fallback es noindex hasta que la
publicación tenga su HTML generado. Las ediciones administrativas ahora usan
`/admin/blog/edit?id=UUID`; los enlaces del panel ya están actualizados.

## 7. Dominio y pruebas

En Render añadir infoatlanticaasociados.com y www.infoatlanticaasociados.com.
Usar EXACTAMENTE los registros DNS que indique Render al conectar el dominio.
Los registros que pusiste para Vercel deberán sustituirse únicamente cuando
la web nueva y la función de Supabase estén funcionando. Conservar MX/TXT del
correo. Configurar www para redirigir al dominio principal y comprobar HTTPS.
En Authentication → URL Configuration usar el dominio como Site URL y añadir
las redirecciones necesarias. Conservar CORS FRONTEND_URL para el dominio real.

Antes de cambiar DNS:
- Login y rol admin; otro usuario recibe rechazo en la API.
- Consultas con adjuntos; descargarlos desde administración.
- Rechazo de archivos que sumen más de 4 MB y límite por conexión.
- Disponibilidad y reservas simultáneas de la misma hora.
- Confirmación/cancelación y correos; revisar notification_jobs.
- Crear, editar y eliminar artículos; verificar lista en vivo y deploy automático.
- Abrir un artículo nuevo directamente, compartir su enlace y revisar sitemap.
- Redeploy y comprobar que datos/documentos permanecen en Supabase.

## Desarrollo y verificación

`npm run dev` ejecuta solo la web; las consultas llaman a la función de Supabase.
`npm run typecheck`, `npm test` y `npm run build:static` comprueban el proyecto.
Para verificar la Edge Function: generar con build:edge y usar Supabase CLI
local con Docker, o Deno para comprobar compatibilidad sin desplegar.
No crear procesos permanentes ni cron de Vercel para esta arquitectura.

La migración del código no publica automáticamente la función, ejecuta SQL en
tu cuenta ni configura Vault, Render o DNS. Esos pasos requieren iniciar sesión.

Referencias:
https://render.com/docs/deploy-nextjs-app
https://render.com/docs/redirects-rewrites
https://supabase.com/docs/guides/functions/deploy
https://supabase.com/docs/guides/functions/secrets
https://supabase.com/docs/guides/functions/schedule-functions
