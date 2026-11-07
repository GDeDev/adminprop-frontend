import type { NextConfig } from "next"

import { securityHeaders } from "../../config/security-headers"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@adminprop/ui",
    "@adminprop/shared-types",
    "@adminprop/mocks",
    "@adminprop/session",
  ],
  // Sin `X-Powered-By: Next.js`: no le anunciamos el framework a nadie.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          sitesUrl: process.env.NEXT_PUBLIC_SITES_URL,
          isDev: process.env.NODE_ENV !== "production",
        }),
      },
    ]
  },
}

export default nextConfig
