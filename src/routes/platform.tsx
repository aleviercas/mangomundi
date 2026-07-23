import { createFileRoute, redirect } from "@tanstack/react-router";

// Orphaned since the home page consolidation — not linked anywhere in the
// site's nav/footer, and PlatformBand.tsx (its supporting section) wasn't
// imported anywhere either. Kept as a redirect (not deleted outright) so any
// old bookmark, backlink, or previously-indexed URL doesn't 404.
export const Route = createFileRoute("/platform")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
