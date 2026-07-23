import { createFileRoute, redirect } from "@tanstack/react-router";

// Leftover from a previous site version — not linked anywhere in the
// current nav/footer and won't be used going forward. Kept as a redirect
// (not deleted outright) so any old bookmark, backlink, or previously-
// indexed URL doesn't 404.
export const Route = createFileRoute("/insurance")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
