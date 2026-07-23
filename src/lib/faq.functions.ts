export interface FaqPair {
  question: string;
  answer: string;
}

// Strips inline markdown so bold/link syntax doesn't leak into JSON-LD text fields.
function stripMarkdown(s: string): string {
  return s
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The blog's FAQ section is written the same way in every locale: a level-2
 * heading (text varies by language — "Frequently asked questions",
 * "Preguntas frecuentes", etc., with no shared i18n key) followed by 4-6
 * Q/A pairs, each a bold question on its own line immediately followed by
 * its answer paragraph, with a blank line between pairs.
 *
 * Rather than matching the heading text — which would need a per-language
 * translation table with no single source of truth — this detects the FAQ
 * section structurally: split the article into H2 sections, then within
 * each section split into blank-line-separated blocks and keep blocks whose
 * first line is a standalone bold phrase. The section with the most such
 * blocks (>= 3) is treated as the FAQ. This is language-agnostic and matches
 * the generation methodology used across all 20 locales.
 */
export function extractFaqPairs(contentMd: string | null | undefined): FaqPair[] | null {
  if (!contentMd) return null;

  const sections = contentMd.split(/\n(?=## )/);
  let best: FaqPair[] | null = null;

  for (const section of sections) {
    const blocks = section.split(/\n\s*\n/);
    const pairs: FaqPair[] = [];
    for (const block of blocks) {
      const m = block.match(/^\*\*(.+?)\*\*\s*\n([\s\S]+)$/);
      if (m) {
        const question = stripMarkdown(m[1]);
        const answer = stripMarkdown(m[2]);
        if (question && answer) pairs.push({ question, answer });
      }
    }
    if (pairs.length >= 3 && (!best || pairs.length > best.length)) {
      best = pairs;
    }
  }

  return best;
}
