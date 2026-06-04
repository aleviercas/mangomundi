interface WordmarkProps {
  className?: string;
}

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      className={`font-sans tracking-[-0.03em] leading-none ${className}`}
      aria-label="MangoGlobal"
    >
      <span className="font-semibold text-slate-950">Mango</span>
      <span className="font-medium text-amber-500">Global</span>
    </span>
  );
}
