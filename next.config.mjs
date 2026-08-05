import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot
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
    "@ufo/validation"
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.c2.liara.site"
      }
    ]
  }
};

export default nextConfig;
