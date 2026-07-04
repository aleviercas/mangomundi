import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy alias — the comparator lives on the home page now. Straight redirect
// (not via /compare) to avoid a redirect chain.
export const Route = createFileRoute("/fx-tool")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
