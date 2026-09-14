import { test, expect, type Page } from "@playwright/test";

/**
 * i18n smoke test — verifies that the active language is reflected in the
 * rendered DOM across routes.
 *
 * 2026-09-13 — reescrito para el esquema de URLs por idioma (Opción B,
 * ver docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md): el idioma
 * ahora vive en el path (/es/..., /de/...), no en `?lang=`. `?lang=xx`
 * sobre una URL vieja sigue funcionando pero ahora hace un 301 real hacia
 * la URL con prefijo — Playwright sigue redirects por default, así que
 * `page.goto("/?lang=es")` termina en `/es` de todos modos, pero los tests
 * de acá pegan directo a la URL final para no depender de ese detalle.
 *
 * El selector de idioma (LangSwitcher.tsx) SÍ existe en la UI y navega de
 * verdad a la URL con prefijo (recarga completa) — el comentario viejo de
 * este archivo decía lo contrario, ya no es cierto (si alguna vez lo fue).
 *
 * `/compare`, `/pricing`, etc. son redirects a home (ver src/routes/
 * compare.tsx y sus hermanos) — home sigue siendo la única ruta testeada
 * acá directamente por su comparador/i18n.
 *
 * expectContains tokens come from the live dictionaries (comparator/search
 * keys rendered on these routes) — update them if that copy changes.
 */

const CASES: Array<{ lang: string; htmlLang: string; expectContains: string[] }> = [
  // Spanish — comparator/search copy
  { lang: "es", htmlLang: "es", expectContains: ["Empresa", "Comparar", "país", "envía"] },
  // German — comparator/search copy
  {
    lang: "de",
    htmlLang: "de",
    expectContains: ["Vergleichen", "Land", "Unternehmen", "Sie senden"],
  },
  // Japanese — non-Latin script smoke
  { lang: "ja", htmlLang: "ja", expectContains: ["比較", "送金", "国"] },
];

async function goto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
}

test.describe("i18n — locale from the URL's language prefix is live in the browser", () => {
  for (const c of CASES) {
    test(`renders ${c.lang} translations at /${c.lang}`, async ({ page }) => {
      await goto(page, `/${c.lang}/`);
      await expect
        .poll(async () => page.evaluate(() => document.documentElement.lang))
        .toBe(c.htmlLang);

      // At least one of the expected localized tokens must appear somewhere on
      // the page (soft OR-check; routes don't all contain every token).
      const bodyText = (await page.locator("body").innerText()).toLowerCase();
      const anyFound = c.expectContains.some((s) => bodyText.includes(s.toLowerCase()));
      expect(
        anyFound,
        `expected /${c.lang}/ to contain one of [${c.expectContains.join(", ")}]`,
      ).toBeTruthy();
    });
  }

  test("legacy ?lang=xx on the bare URL 301s to the path-prefixed URL", async ({ page }) => {
    const response = await page.goto("/legal?lang=es", { waitUntil: "domcontentloaded" });
    // Playwright follows redirects transparently; assert on where we ended up
    // (response.url() reflects the final, post-redirect URL) rather than the
    // raw status of the first hop.
    expect(response?.url()).toContain("/es/legal");
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("es");
  });

  test("the bare URL is deterministically English, regardless of a previous /es visit", async ({
    page,
  }) => {
    // 2026-09-13 — esto reemplaza el test viejo de "?lang persiste en
    // localStorage y sobrevive a la navegación sin el param": esa
    // persistencia era justo el antipatrón que se corrigió (servir
    // contenido distinto en la MISMA URL según una preferencia guardada,
    // ver docs/handoff/handoff-2026-09-10-plan-urls-por-idioma.md §2). El
    // comportamiento correcto ahora es el opuesto: la URL sin prefijo es
    // determinísticamente inglés para cualquiera, sin importar una visita
    // previa a /es — y este test lo confirma explícitamente en vez de dar
    // por sentado que sigue igual.
    await goto(page, "/es/");
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("es");

    await goto(page, "/legal");
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("en");
  });

  test("the language switcher navigates to the path-prefixed URL", async ({ page }) => {
    await goto(page, "/legal");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    // LangSwitcher.tsx — un botón/trigger con el idioma actual, que abre un
    // dropdown de opciones. Selector deliberadamente laxo (por rol +
    // nombre visible) para no acoplarse a una clase interna que pueda
    // cambiar con el rediseño de kayakclone.
    await page.getByRole("button", { name: /english/i }).first().click();
    await page.getByRole("option", { name: /español/i }).click();

    // LangSwitcher navega con una recarga completa (window.location) — dar
    // tiempo a que la nueva página cargue antes de leer el DOM.
    await page.waitForURL(/\/es\/legal/);
    await expect.poll(async () => page.evaluate(() => document.documentElement.lang)).toBe("es");
  });

  test("hreflang alternates are present in the document head", async ({ page }) => {
    await goto(page, "/");
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
