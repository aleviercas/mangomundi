interface WordmarkProps {
  className?: string;
  /** Override colour (default: slate-950). Pass "light" for dark backgrounds. */
  tone?: "dark" | "light";
}

/**
 * mangomundi wordmark — 100% monocromático, minúsculas.
 * Contraste tipográfico marcado: "mango" font-black, "global" font-extralight.
 */
export function Wordmark({ className = "", tone = "dark" }: WordmarkProps) {
  const colour = tone === "light" ? "text-foreground" : "text-foreground";
  return (
    <span
      className={`font-sans lowercase leading-none ${colour} ${className}`}
      aria-label="mangomundi"
    >
      <span className="font-black tracking-tight">mango</span>
      <span className="font-extralight tracking-wide">global</span>
    </span>
  );
}
