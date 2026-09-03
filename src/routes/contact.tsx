import { createFileRoute, redirect } from "@tanstack/react-router";

// 2026-08-30 feedback — ContactSection moved off the home page onto
// /about's own closing section (same id="contact"), so this redirects
// there now instead of a home anchor that no longer exists.
export const Route = createFileRoute("/contact")({
  beforeLoad: () => {
    throw redirect({ to: "/about", hash: "contact" });
  },
});
