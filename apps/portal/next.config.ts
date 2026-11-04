import type { NextConfig } from "next"

import { securityHeaders } from "../../config/security-headers"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@adminprop/ui",
    "@adminprop/shared-types",
    "@adminprop/mocks",
    "@adminprop/session",
  ],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          apiUrl: process.env.NEXT_PUBLIC_API_URL,
          isDev: process.env.NODE_ENV !== "production",
        }),
      },
    ]
  },
}

export default nextConfig
