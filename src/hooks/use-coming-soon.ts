// 2026-09-12 — split out of src/components/ComingSoonModal.tsx: that file
// exporting both the ComingSoonProvider component AND this context/hook
// pair triggered react-refresh/only-export-components (a file with mixed
// component + non-component exports forces a full reload instead of a hot
// swap on edit). Nothing in the codebase currently imports useComingSoon
// (features open the modal via the global `[data-coming-soon]` click
// delegation in ComingSoonModal.tsx instead) but it's kept as the intended
// programmatic escape hatch, just isolated so ComingSoonModal.tsx can be a
// components-only file.
import { createContext, useContext } from "react";

interface ComingSoonContextValue {
  open: (source: string) => void;
}

export const ComingSoonContext = createContext<ComingSoonContextValue | null>(null);

export function useComingSoon() {
  const ctx = useContext(ComingSoonContext);
  if (!ctx) throw new Error("useComingSoon must be used within ComingSoonProvider");
  return ctx;
}
