import { useState } from "react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  name: string;
  /** Any URL belonging to the brand (website, affiliate link, etc.). The hostname is extracted automatically. */
  url?: string | null;
  /** Explicit domain (e.g. "wise.com"). Takes precedence over `url`. */
  domain?: string | null;
  size?: number;
  className?: string;
  rounded?: boolean;
}

function extractDomain(input?: string | null): string | null {
  if (!input) return null;
  try {
    const u = new URL(input.startsWith("http") ? input : `https://${input}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Renders the real brand logo via Clearbit's public logo service.
 * Falls back to a clean monogram (initials on a tinted background) if the
 * logo cannot be fetched. No invented emojis are ever shown.
 */
export function BrandLogo({ name, url, domain, size = 32, className, rounded = true }: BrandLogoProps) {
  const host = domain ?? extractDomain(url);
  const [failed, setFailed] = useState(false);

  if (host && !failed) {
    return (
      <img
        src={`https://logo.clearbit.com/${host}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 object-contain bg-white",
          rounded ? "rounded-md" : "",
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-muted text-muted-foreground font-semibold",
        rounded ? "rounded-md" : "",
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initials(name) || "•"}
    </span>
  );
}
