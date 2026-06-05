interface WordmarkProps {
  className?: string;
  /** Override colour (default: slate-950). Pass e.g. "text-white" for dark backgrounds. */
  tone?: "dark" | "light";
}

export function Wordmark({ className = "", tone = "dark" }: WordmarkProps) {
  const colour = tone === "light" ? "text-white" : "text-slate-950";
  return (
    <span
      className={`font-sans lowercase tracking-tight leading-none ${colour} ${className}`}
      aria-label="mangoglobal"
    >
      <span className="font-black">mango</span>
      <span className="font-light">global</span>
    </span>
  );
}
