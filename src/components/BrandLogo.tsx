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
 * Renders the real brand logo via unavatar.io (aggregates multiple logo
 * sources — much sharper than a plain favicon at larger sizes). Falls back
 * to a clean monogram (initials on a tinted background) if the logo cannot
 * be fetched. No invented emojis are ever shown.
 */
export function BrandLogo({ name, url, domain, size = 32, className, rounded = true }: BrandLogoProps) {
  const host = domain ?? extractDomain(url);
  const [failed, setFailed] = useState(false);

  if (host && !failed) {
    // Always request a higher-resolution source (at least 128px) regardless
    // of the display size, then let the browser scale it down via CSS.
    // Some of unavatar's underlying sources (plain favicons especially) are
    // tiny by default — if we ask for exactly the display size, we can get
    // e.g. a 16px favicon stretched up to 44px, which is what was showing
    // as blurry/pixelated. Downscaling a larger image always looks sharp;
    // upscaling a small one never does.
    const requestSize = Math.max(size * 3, 128);
    return (
      <img
        src={`https://unavatar.io/${host}?fallback=false&size=${requestSize}`}
        alt={`${name} logo`}
        width={size}
        height={size}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn(
          "shrink-0 object-contain",
          rounded ? "rounded-lg" : "",
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
