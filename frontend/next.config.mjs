import { fileURLToPath } from 'node:url';
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  reactStrictMode: true,
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  images: { unoptimized: true },
};
export default nextConfig;
