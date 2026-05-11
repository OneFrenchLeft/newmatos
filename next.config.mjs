import withBundleAnalyzer from "@next/bundle-analyzer"

/**
 * @template {import('next').NextConfig} T
 * @param {T} config
 */
function defineNextConfig(config) {
  return withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
  })(config)
}

export default defineNextConfig({
  output: "standalone",
  reactStrictMode: true,
  turbopack: {},
})
