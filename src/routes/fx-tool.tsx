import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/fx-tool")({
  beforeLoad: () => {
    throw redirect({ to: "/compare" });
  },
});
