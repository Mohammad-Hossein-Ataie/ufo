import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const command = process.argv[2];
if (!["dev", "build", "start"].includes(command)) throw new Error("Expected dev, build or start.");
// Set the mode before Next loads env files or imports React. Deployment stages
// belong in a separate variable, never NODE_ENV. Do not print environment values.
process.env.NODE_ENV = command === "dev" ? "development" : "production";
const require = createRequire(import.meta.url);
if (command === "start") {
  // Next may initialize instrumentation lazily. Check before opening the port,
  // after loading the same production env files Next uses.
  require("@next/env").loadEnvConfig(process.cwd(), false);
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32 || /^(replace[-_ ]|development[-_ ])/i.test(secret)) {
    throw new Error(
      "SESSION_SECRET is required in production: use at least 32 random characters, not a placeholder.",
    );
  }
}
await import(pathToFileURL(require.resolve("next/dist/bin/next")).href);
