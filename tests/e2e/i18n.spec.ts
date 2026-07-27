import { test, expect, type Page } from "@playwright/test";

/**
 * i18n smoke test — verifies that the active language is reflected in the
 * rendered DOM across routes. We use the `?lang=<code>` query param, which is
 * honoured by I18nProvider as the highest-priority initialiser (and persisted
 * to localStorage, which we also assert).
 *
 * The manual language switcher was intentionally removed from the UI —
 * language is auto-detected by geo (x-vercel-ip-country) with ?lang as the
 * explicit override — so there is no dropdown test here anymore.
 *
 * `/compare`, `/pricing`, etc. are redirect-only stubs to home now (see
 * src/routes/compare.tsx and friends) — home is the only route with its own
 * comparator/i18n content, so it's the only one tested here.
 *
 * expectContains tokens come from the live dictionaries (comparator/search
 * keys rendered on these routes) — update them if that copy changes.
 */

const ROUTES = ["/"];

const CASES: Array<{ lang: string; htmlLang: string; expectContains: string[] }> = [
  // Spanish — comparator/search copy
  { lang: "es", htmlLang: "es", expectContains: ["Empresa", "Comparar", "país", "envía"] },
  // German — comparator/search copy
  { lang: "de", htmlLang: "de", expectContains: ["Vergleichen", "Land", "Unternehmen", "Sie senden"] },
  // Japanese — non-Latin script smoke
  { lang: "ja", htmlLang: "ja", expectContains: ["比較", "送金", "国"] },
];

async function goto(page: Page, route: string, lang: string) {
  await page.goto(`${route}?lang=${lang}`, { waitUntil: "domcontentloaded" });
  // Wait until the I18nProvider has hydrated and updated <html lang>.
  await expect
    .poll(async () => page.evaluate(() => document.documentElement.lang))
    .toBe(lang);
}

test.describe("i18n — locale from ?lang is live in the browser", () => {
  for (const c of CASES) {
    test(`renders ${c.lang} translations across key routes`, async ({ page }) => {
      for (const route of ROUTES) {
        await goto(page, route, c.lang);
        expect(await page.evaluate(() => document.documentElement.lang)).toBe(c.htmlLang);

        // At least one of the expected localized tokens must appear somewhere on
        // the page (soft OR-check; routes don't all contain every token).
        const bodyText = (await page.locator("body").innerText()).toLowerCase();
        const anyFound = c.expectContains.some((s) => bodyText.includes(s.toLowerCase()));
        expect(
          anyFound,
          `expected ${route}?lang=${c.lang} to contain one of [${c.expectContains.join(", ")}]`,
        ).toBeTruthy();
      }
    });
  }

  test("?lang persists to localStorage and survives navigation without the param", async ({
    page,
  }) => {
    await page.goto("/?lang=es", { waitUntil: "domcontentloaded" });
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.lang))
      .toBe("es");

    // Persisted for future visits.
    expect(await page.evaluate(() => localStorage.getItem("mg.lang"))).toBe("es");

    // A later visit WITHOUT ?lang should restore the persisted language.
    // (/legal — a real, distinct page, not a redirect stub — is a better
    // cross-route check than a route that just bounces back to home.)
    await page.goto("/legal", { waitUntil: "domcontentloaded" });
    await expect
      .poll(async () => page.evaluate(() => document.documentElement.lang))
      .toBe("es");
  });

  test("hreflang alternates are present in the document head", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const alternates = await page.evaluate(() =>
      [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) =>
        l.getAttribute("hreflang"),
      ),
    );
    expect(alternates).toContain("es");
    expect(alternates).toContain("x-default");
    expect(alternates.length).toBeGreaterThanOrEqual(21); // 20 langs + x-default
  });
});
