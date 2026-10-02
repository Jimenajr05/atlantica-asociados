# Atlántica & Asociados

Sitio web oficial, plataforma de recepción de casos y sistema de gestión de contenidos para **Atlántica & Asociados** — Servicio en línea de asesoría ciudadana, redacción técnica y gestión de trámites ante instituciones en Costa Rica cuando los derechos de las personas son vulnerados.

---

## Publicación

Para publicar con **Vercel + Supabase**, el dominio existente y sin Render,
seguir [DEPLOYMENT.md](DEPLOYMENT.md). La página y la API Express se alojan
en un proyecto Vercel con Services. Supabase conserva datos, adjuntos y notificaciones.
En producción el almacenamiento local está deshabilitado. El formulario admite
hasta cinco archivos con 4 MB en total.

## 🏛️ Arquitectura Desacoplada (Frontend & Backend)

El proyecto se encuentra modularizado en dos aplicaciones independientes y autónomas:

```
atlantica-asociados/
├── backend/                  # Servidor de API (Node.js + Express + TypeScript)
│   ├── data/                 # Almacenamiento local persistente (cases.json, posts.json)
│   ├── scripts/              # Respaldo de documentos (backup-storage.mjs)
│   ├── src/
│   │   ├── routes/           # Rutas Express (cases, admin-cases, posts, admin-posts)
│   │   ├── services/         # Servicios (cases-store, posts-store, email, rate-limit, supabase-admin)
│   │   ├── types/            # Tipos e interfaces TypeScript
│   │   ├── validations/      # Esquemas de validación Zod
│   │   └── server.ts         # Servidor Express principal (Puerto 5000)
│   ├── supabase/             # Migraciones SQL y esquemas de base de datos
│   ├── .env.example          # Plantilla de variables de entorno del backend
│   └── package.json          # Dependencias y scripts del backend
│
├── frontend/                 # Aplicación Cliente (Next.js 16 + React 19 + Tailwind CSS)
│   ├── public/               # Favicons, logos e imágenes públicas
│   ├── src/
│   │   ├── app/              # Rutas App Router (landing, nosotros, servicios, contacto, blog, admin)
│   │   ├── components/       # Componentes visuales interactivos (Navbar, Footer, CaseForm, ServiceCard, etc.)
│   │   ├── content/          # Catálogos de contenido (servicios, preguntas frecuentes, empresa)
│   │   ├── lib/              # Clientes de API, renderizado Markdown y cliente Supabase
│   │   └── types/            # Tipos compartidos
│   ├── next.config.mjs       # Configuración Next.js con proxy reverso a /api/*
│   ├── tailwind.config.js    # Paleta de 4 colores y temas
│   ├── .env.example          # Plantilla de variables de entorno del frontend
│   └── package.json          # Dependencias y scripts del frontend
│
├── package.json              # Orquestador raíz con scripts para ambos entornos
└── README.md                 # Documentación completa
```

---

## 🚀 Comandos Rápidos de Ejecución

### Acceso de administración

Todas las rutas `/admin`, excepto `/admin/login`, requieren una sesión válida de Supabase de `infoatlantica.asociados@gmail.com` y un registro en `profiles` con `role = 'admin'`. La API aplica las mismas restricciones, incluso en desarrollo; sin configuración de autenticación rechaza las peticiones de administración. Las pruebas automatizadas con `NODE_ENV=test` mantienen su modo aislado sin Supabase. Sin sesión se redirige al login antes de renderizar el panel. Una sesión vigente permite volver al panel sin introducir las credenciales otra vez.

El inicio de sesión utiliza correo y contraseña. Configure `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el frontend, cree la cuenta `infoatlantica.asociados@gmail.com` en Supabase Authentication y asigne el rol `admin` a su registro en `profiles`.

Desde la raíz del repositorio:

Utilice Node.js 22.18 o posterior. Ejecute `npm run typecheck` y `npm test` para comprobar tipos y pruebas en ambas aplicaciones.

| Comando | Acción |
| :--- | :--- |
| `npm run dev` | **Ejecuta ambos simultáneamente** (Backend en `http://localhost:5000` y Frontend en `http://localhost:3000`) |
| `npm run dev:backend` | Ejecuta únicamente el servidor backend con recarga automática |
| `npm run dev:frontend` | Ejecuta únicamente el cliente web Next.js |
| `npm run build` | Compila tanto el backend (`tsc`) como el frontend (`next build`) |
| `npm run typecheck` | Verifica tipos y detecta imports y variables sin uso en ambas aplicaciones |
| `npm test` | Ejecuta pruebas con datos temporales y servicios de notificación simulados |

---

## 📋 Resumen Tecnológico

### Backend (`/backend`)
- **Servidor**: Node.js + Express + TypeScript (`tsx`).
- **Validaciones**: Zod (esquemas de consulta y validación de archivos).
- **Procesamiento de Archivos**: Multer con almacenamiento en memoria para reenvío seguro a Supabase Storage.
- **Seguridad**: Limitador por IP compartido en Supabase en producción y en memoria en desarrollo, Honeypot anti-spam, CORS configurado.
- **Persistencia**: Supabase (PostgreSQL + RLS + Storage) en producción; almacenamiento local en `backend/data/*.json` únicamente para desarrollo y pruebas.
- **Comunicaciones**: Nodemailer con plantillas HTML profesionales para notificaciones instantáneas de casos.

### Frontend (`/frontend`)
- **Framework**: Next.js 16+ (App Router) + React 19 + TypeScript.
- **Estilos**: Tailwind CSS con sistema de tokens mediante variables CSS (Paleta de 4 colores: Azul Rey, Blanco, Negro y Dorado).
- **Proxy Transparente**: `next.config.mjs` redirige las peticiones a `/api/*` al backend de manera invisible, evitando problemas de CORS en navegadores.
- **SEO & Rendimiento**: Generación Estática (SSG) / Revalidación Incremental (ISR), metadatos dinámicos por página, Sitemap XML dinámico, Robots.txt y marcado Schema.org (`Organization`, `FAQPage`, `Article`).
- **Comunicaciones**: Integración fija con WhatsApp (+506 6002-4545) y formulario de consulta con validación reactiva.

---

## 🎨 Paleta de Cuatro Colores (Configurable en un solo lugar)

Todos los colores del sitio se controlan a través de variables CSS definidas en [`frontend/src/app/globals.css`](frontend/src/app/globals.css) y mapeadas en [`frontend/tailwind.config.js`](frontend/tailwind.config.js):

| Variable CSS | Color / Propósito | Código Hex |
| :--- | :--- | :--- |
| `--color-azul-rey` | Base institucional, confianza y seriedad | `#163664` |
| `--color-blanco` | Fondos limpios y contraste de lectura | `#ffffff` |
| `--color-negro` | Fondo del encabezado (destaca el logo oficial) y contrastes | `#0b0f19` |
| `--color-dorado` | Detalles del logo, botones secundarios, acentos y resaltados | `#d4af37` |

---

## 📌 Guía de Configuración Paso a Paso

### 1. Variables de Entorno

#### Backend (`backend/.env`):
```env
PORT=5000
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
TRUST_PROXY=loopback

# Supabase (Opcional - Si no se configura, usará el almacén local en backend/data/)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-privada
SUPABASE_STORAGE_BUCKET=case-documents

# Configuración SMTP para Notificaciones
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=infoatlantica.asociados@gmail.com
SMTP_PASS=tu-contraseña-o-app-password
SMTP_FROM="Atlántica & Asociados <infoatlantica.asociados@gmail.com>"
NOTIFICATION_EMAIL_TO=infoatlantica.asociados@gmail.com
RATE_LIMIT_MAX_PER_HOUR=5
```

#### Frontend (`frontend/.env.local`):
```env
BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=50660024545
NEXT_PUBLIC_WHATSAPP_DEFAULT_MESSAGE="Hola, necesito información y asesoría sobre un trámite ante una institución."
NEXT_PUBLIC_CONTACT_EMAIL=infoatlantica.asociados@gmail.com

# Supabase (Opcional - Para autenticación de sesión de admin)
NEXT_PUBLIC_SUPABASE_URL=https://placeholder-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key
```

### 2. Base de Datos en Supabase (Opcional)
1. En [supabase.com](https://supabase.com), abra el **SQL Editor**.
2. Ejecute el script [`backend/supabase/migrations/001_initial_schema.sql`](backend/supabase/migrations/001_initial_schema.sql).
3. Ejecute también las migraciones posteriores en orden. Para separar Blog y noticias, aplique [`004_post_categories.sql`](backend/supabase/migrations/004_post_categories.sql). Los artículos existentes quedan en Blog.
4. Cree publicaciones desde el administrador y seleccione su tipo: Blog o Noticias. En almacenamiento local no se requiere migración.
5. Aplique [`005_backend_only_submissions.sql`](backend/supabase/migrations/005_backend_only_submissions.sql) para que casos y documentos solo ingresen por el backend y no puedan saltarse sus validaciones usando la clave pública.

Para desplegar, configure `NODE_ENV=production`, credenciales reales de Supabase y un perfil con rol `admin`. El backend valida el token y el rol en todas las rutas administrativas. Sin Supabase, el acceso local está habilitado únicamente con `NODE_ENV=development` o `test`. Configure `TRUST_PROXY` con las direcciones o redes de sus proxies de confianza; `loopback` corresponde al proxy Next.js en la misma máquina.

En modo local, los adjuntos se guardan en `backend/data/case-files/` y se descargan mediante la API administrativa; este directorio debe respaldarse junto con los JSON. Los adjuntos anteriores que solo registraban metadatos no pueden recuperarse automáticamente. El almacenamiento JSON y la cola de notificaciones requieren un único proceso backend y disco persistente. Consulte las plantillas [`backend/.env.example`](backend/.env.example) y [`frontend/.env.example`](frontend/.env.example) para configurar las variables de SMTP y WhatsApp.

---

## 📡 Endpoints del Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor y tiempo de actividad |
| `POST` | `/api/cases` | Recepción de caso ciudadano (multipart con archivos) |
| `GET` | `/api/admin/cases` | Listado completo de expedientes |
| `PATCH`| `/api/admin/cases/:id/status` | Actualización de estado del caso |
| `POST` | `/api/admin/cases/:id/notes` | Creación de nota interna administrativa |
| `DELETE`| `/api/admin/cases/:id` | Eliminación de expediente y documentos asociados |
| `POST` | `/api/admin/cases/:id/signed-url` | Generación de URL firmada para descarga de adjunto |
| `GET` | `/api/posts` | Artículos públicos del blog |
| `GET` | `/api/posts/:slug` | Artículo específico por su slug |
| `GET` | `/api/admin/posts` | Todos los artículos (publicados y borradores) |
| `POST` | `/api/admin/posts` | Creación de nuevo artículo |
| `PUT` | `/api/admin/posts/:id` | Actualización de artículo |
| `DELETE`| `/api/admin/posts/:id` | Eliminación de artículo |
