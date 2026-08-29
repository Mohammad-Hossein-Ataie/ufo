import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "ufopuff.ir" }],
        destination: "https://ufopuff.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ufopuff.ir" }],
        destination: "https://ufopuff.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.ufopuff.com" }],
        destination: "https://ufopuff.com/:path*",
        permanent: true,
      },
    ];
  },
  turbopack: {
    root: projectRoot,
  },
  transpilePackages: [
    "@ufo/auth",
    "@ufo/chat",
    "@ufo/config",
    "@ufo/database",
    "@ufo/domain",
    "@ufo/inventory",
    "@ufo/invoices",
    "@ufo/notifications",
    "@ufo/orders",
    "@ufo/payments",
    "@ufo/pricing",
    "@ufo/search",
    "@ufo/seo",
    "@ufo/shipping",
    "@ufo/storage",
    "@ufo/types",
    "@ufo/ui",
    "@ufo/validation",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.c2.liara.site",
      },
      {
        protocol: "https",
        hostname: "bucket.ufopuff.com",
      },
      {
        protocol: "http",
        hostname: "bucket.ufopuff.com",
      },
    ],
  },
};

export default nextConfig;
