import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/risk")({
  beforeLoad: () => {
    throw redirect({ to: "/legal", hash: "risk" });
  },
});
