import { safeErrorDetails } from "@/lib/payment-diagnostics";

const state = globalThis as typeof globalThis & { ufoRuntimeDiagnosticsRegistered?: boolean };

export function registerNodeDiagnostics() {
  if (state.ufoRuntimeDiagnosticsRegistered) return;
  state.ufoRuntimeDiagnosticsRegistered = true;
  console.info("[APP] startup", {
    nodeEnv: process.env.NODE_ENV,
    nodeVersion: process.version,
    pid: process.pid,
  });
  process.on("warning", (warning) => console.warn("[APP] warning", safeErrorDetails(warning)));
  // Monitor only: retain Node's default crash behavior, including unhandled rejections.
  process.on("uncaughtExceptionMonitor", (error, origin) => {
    console.error("[APP] uncaught-exception", { origin, ...safeErrorDetails(error) });
  });
  process.on("exit", (code) => console.info("[APP] exit", { pid: process.pid, code }));
}
