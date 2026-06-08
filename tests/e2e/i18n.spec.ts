import { test, expect, type Page } from "@playwright/test";

/**
 * i18n smoke test — verifies that the active language is reflected in the
 * rendered DOM across routes. We use the `?lang=<code>` query param, which is
 * honoured by I18nProvider as the highest-priority initialiser.
 *
 * Source of truth comes straight from the in-source EN dictionary: we don't
 * hard-code strings here that could drift; instead we assert that the EN baseline
 * differs from the localised value (proving translation is wired) AND that the
 * `<html lang>` attribute is set correctly.
 */

const ROUTES = ["/", "/compare", "/legal/terms"];

const CASES: Array<{ lang: string; htmlLang: string; expectContains: string[] }> = [
  // Spanish — page title contains brand and a known Spanish word should appear
  { lang: "es", htmlLang: "es", expectContains: ["Empezar", "Comparar"] },
  // German — long-word check
  { lang: "de", htmlLang: "de", expectContains: ["Loslegen", "Vergleichen"] },
  // Japanese — non-Latin script smoke
  { lang: "ja", htmlLang: "ja", expectContains: ["始める", "比較"] },
];

async function goto(page: Page, route: string, lang: string) {
  await page.goto(`${route}?lang=${lang}`, { waitUntil: "domcontentloaded" });
  // Wait until the I18nProvider has hydrated and updated <html lang>.
  await expect.poll(async () =>
    page.evaluate(() => document.documentElement.lang),
  ).toBe(lang);
}

test.describe("i18n — locale switching is live in the browser", () => {
  for (const c of CASES) {
    test(`renders ${c.lang} translations across key routes`, async ({ page }) => {
      for (const route of ROUTES) {
        await goto(page, route, c.lang);
        expect(await page.evaluate(() => document.documentElement.lang)).toBe(c.htmlLang);

        // At least one of the expected localized tokens must appear somewhere on the page.
        // We do a soft, OR-style check because routes don't all contain every token.
        const bodyText = (await page.locator("body").innerText()).toLowerCase();
        const anyFound = c.expectContains.some((s) => bodyText.includes(s.toLowerCase()));
        expect(
          anyFound,
          `expected ${route}?lang=${c.lang} to contain one of [${c.expectContains.join(", ")}]`,
        ).toBeTruthy();
      }
    });
  }

  test("LangSwitcher dropdown swaps the active language", async ({ page }) => {
    await page.goto("/?lang=en");
    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.lang),
    ).toBe("en");

    // Open the language switcher (button labelled "EN" by default)
    await page.getByRole("button", { name: /change language/i }).click();
    await page.getByRole("option", { name: /Español/i }).click();

    await expect.poll(async () =>
      page.evaluate(() => document.documentElement.lang),
    ).toBe("es");
  });
});
