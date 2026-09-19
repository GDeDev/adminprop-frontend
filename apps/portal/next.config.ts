import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@adminprop/ui",
    "@adminprop/shared-types",
    "@adminprop/mocks",
    "@adminprop/session",
  ],
}

export default nextConfig
