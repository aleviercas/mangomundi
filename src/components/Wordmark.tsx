interface WordmarkProps {
  className?: string;
  /** Override colour (default: slate-950). Pass "light" for dark backgrounds. */
  tone?: "dark" | "light";
}

/**
 * mangomundi wordmark — bicromático, minúsculas, bold.
 * "mango" en foreground, "mundi" en accent (coral), siguiendo el lockup oficial.
 */
export function Wordmark({ className = "", tone = "dark" }: WordmarkProps) {
  const colour = tone === "light" ? "text-white" : "text-foreground";
  return (
    <span
      className={`font-sans lowercase leading-none font-black tracking-tight ${colour} ${className}`}
      aria-label="mangomundi"
    >
      <span>mango</span>
      <span className="text-accent">mundi</span>
    </span>
  );
}
