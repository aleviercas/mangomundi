// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.
//
// This must work on BOTH runtimes:
//   - bun / Cloudflare Workers → Web-style `globalThis.addEventListener`
//   - Node / Vercel            → `process.on(...)`  (addEventListener is undefined)
// The original version only wired the Workers path, so on Vercel it was a
// complete no-op: consumeLastCapturedError() always returned undefined (hence
// no real stack traces in logs), and — with no `unhandledRejection` listener —
// Node terminates the whole serverless function on any stray promise rejection
// (Node 15+), which surfaces as our branded crash page.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

function record(error: unknown) {
  lastCapturedError = { error, at: Date.now() };
}

// Idempotency guard: this module is a side-effect import (server.ts) and dev
// HMR / multiple bundles could otherwise register duplicate listeners.
const GUARD = "__mm_error_capture_installed__";
type GuardedGlobal = typeof globalThis & { [GUARD]?: boolean };

if (!(globalThis as GuardedGlobal)[GUARD]) {
  (globalThis as GuardedGlobal)[GUARD] = true;

  // Workers / browser / bun: Web-style global error events.
  if (typeof globalThis.addEventListener === "function") {
    globalThis.addEventListener("error", (event) => record((event as ErrorEvent).error ?? event));
    globalThis.addEventListener("unhandledrejection", (event) =>
      record((event as PromiseRejectionEvent).reason),
    );
  }

  // Node / Vercel: process-level handlers. Merely registering an
  // `unhandledRejection` listener stops Node from killing the function on a
  // stray rejection; recording the reason lets server.ts log the real error
  // instead of the generic h3 fallback. `uncaughtException` is handled the same
  // way — in a short-lived, per-request serverless function, swallowing +
  // logging a stray throw and letting server.ts render a clean branded page is
  // strictly better than the platform killing the process. Deliberate
  // resilience trade-off, not a blanket "ignore all errors".
  if (typeof process !== "undefined" && typeof process.on === "function") {
    process.on("unhandledRejection", (reason) => {
      record(reason);
      console.error("[error-capture] unhandledRejection:", reason);
    });
    process.on("uncaughtException", (err) => {
      record(err);
      console.error("[error-capture] uncaughtException:", err);
    });
  }
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
