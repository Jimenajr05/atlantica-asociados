# Atlántica & Asociados

Sitio web oficial, plataforma de recepción de casos y sistema de gestión de contenidos para **Atlántica & Asociados** — Servicio en línea de asesoría ciudadana, redacción técnica y gestión de trámites ante instituciones en Costa Rica cuando los derechos de las personas son vulnerados.

---

## Publicación

La web se publica como archivos estáticos, sin servidores permanentes de Next.js
ni Express. Next.js genera el HTML; Supabase Auth, Database, Storage y una Edge
Function gestionan login, consultas, citas, documentos y notificaciones.
Seguir [DEPLOYMENT.md](DEPLOYMENT.md). Render aloja los archivos estáticos;
Supabase conserva todos los datos. El formulario admite cinco archivos y 4 MB
en total. No importar credenciales privadas en el hosting de la web.
