import type { NextConfig } from 'next'

const backendUrl = process.env.BACKEND_URL?.replace(/\/+$/, '')

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Same-origin proxy for the backend, replacing the Vite dev-server proxy.
  async rewrites() {
    if (!backendUrl) return []
    return [{ source: '/api/:path*', destination: `${backendUrl}/api/:path*` }]
  },
}

export default nextConfig
