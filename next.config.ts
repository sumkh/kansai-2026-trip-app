import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // /guide reads the master plan from docs/ at request time. Output tracing
  // has no way to know that — the path is assembled at runtime — so without
  // this the file is missing in production and the page 500s.
  outputFileTracingIncludes: {
    '/guide': ['./docs/KANSAI-2026-MASTER-PLAN.md'],
  },
}

export default nextConfig
