import { fileURLToPath } from 'node:url';

// Evitar publicar un formulario que apunte al equipo local o a otra API.
if (process.env.VERCEL === '1') {
  const backendUrl = process.env.BACKEND_URL;
  const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  for (const [name, value] of Object.entries({ BACKEND_URL: backendUrl, NEXT_PUBLIC_BACKEND_URL: publicBackendUrl })) {
    let url;
    try { url = new URL(value || ''); } catch { /* Se informa abajo con el nombre de la variable. */ }
    if (!url || url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error(`${name} debe ser el origen HTTPS del backend de Vercel, sin rutas ni credenciales.`);
    }
  }
  if (new URL(backendUrl).origin !== new URL(publicBackendUrl).origin) {
    throw new Error('BACKEND_URL y NEXT_PUBLIC_BACKEND_URL deben apuntar al mismo backend.');
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: fileURLToPath(new URL('.', import.meta.url)),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    const backendUrl = (process.env.BACKEND_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
