import { useI18n } from "@/lib/i18n";

/** Horizontal hero: centered headline + subtitle, full width. The unified
 *  comparator box (ComparatorSection) sits directly below.
 *
 *  `compact` collapses this away once a comparison has a result — same
 *  headline/tagline/trust-bar content, just not shown, so the sticky
 *  search bar and the results below it don't have to fight the hero for
 *  the first screenful (the Kayak/Skyscanner "search collapses, results
 *  take the screen" pattern applied to this single page rather than a
 *  second results route). Height (not just opacity) is what animates —
 *  a `grid-rows` 0fr/1fr transition, so the space actually closes instead
 *  of leaving a blank gap. */
export function HeroSection({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <section
      // 2026-09-01 feedback — "el primer fondo del comparador es igual que
      // el de todays routes... deberían alternarse los colores": this
      // section had no background of its own, so it (and the comparator
      // card right below it) inherited the page's cream `--background`
      // token — the exact same shade Today's Routes also shows through
      // with (that section has no background either, by design). The
      // mockup's hero+comparator band is explicit white (design/Mangomundi
      // 4 - Final.dc.html line 68), one step lighter than the page cream —
      // giving it back here, plus on ComparatorSection's own wrapper (see
      // its own comment), creates the white → cream → white → dark rhythm
      // the mockup actually has instead of two adjacent bands reading as
      // one.
      // 2026-09-02 feedback — "achicar un poco el espacio antes del título
      // H1" y "reducir un poco el espacio entre el subtítulo... y el
      // comparador": pt-8/sm:pt-14 → pt-6/sm:pt-10 (menos aire arriba del
      // H1), pb-8/sm:pb-10 → pb-5/sm:pb-6 (el comparador queda más cerca
      // del subtítulo) — junto con el header del comparador ahora más
      // bajo (ver el comment de la card de ComparatorSection), la sección
      // completa entra más holgada en una pantalla.
      // 2026-09-04 feedback (ronda 7) — "hay bandas de diferentes colores
      // entre el titulo del home y el selector, en kayak es todo el mismo
      // color": kayak envuelve título + tiles de modo + barra de búsqueda
      // en UNA sola tarjeta de un solo color (`.E9x1-card`, medido en vivo:
      // rgb(240,243,245), sin cortes internos). Acá el título vivía en
      // `bg-card` (blanco) y el comparador (sección siguiente, hermana
      // directa en HomePageBody) en `bg-surface-canvas` (beige oscuro) —
      // dos bandas visualmente distintas pegadas una a la otra. Pasa a
      // `bg-surface-canvas` también acá, así las dos secciones comparten
      // exactamente el mismo lienzo y se leen como una sola tarjeta, igual
      // que en kayak. `bg-card` que tenía este `<section>` no era una
      // decisión con historia propia que valga la pena preservar aparte
      // (era simplemente "lo que había antes de que el comparador tuviera
      // su propio lienzo" — ver el comment de ComparatorSection sobre
      // --surface-canvas para el resto de esa historia).
      className={`relative grid overflow-hidden bg-surface-canvas transition-[grid-template-rows,padding] duration-300 ease-out ${
        compact ? "grid-rows-[0fr] py-0" : "grid-rows-[1fr] pt-6 pb-5 sm:pt-10 sm:pb-6"
      }`}
      aria-hidden={compact}
    >
      <div className="relative overflow-hidden">
        {/* 2026-09-04 feedback (ronda 6) — "el dibujo de fondo del signo
            pesos quedo horrible sacalo completamente del home": the
            translucent coin/currency-symbol SVG added ronda 5 (right edge,
            xl:+ only) is gone. Kayak's own hero has no decorative artwork
            competing with the headline — plain background, and that's what
            this goes back to. `overflow-hidden` stays on the wrapper; it's
            harmless with nothing left to clip and cheaper to leave than to
            verify nothing else here relies on it. */}
        {/* docs/kayak-redesign-spec.md §6.2 — el titular pasa de centrado a
            alineado a la IZQUIERDA y el contenedor baja de max-w-7xl (1280)
            a 1180, el mismo ancho que el comparador de §3.1: centrado sobre
            una barra de búsqueda alineada a la izquierda, el bloque entero
            se leía como dos piezas de páginas distintas. */}
        <div className="relative mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          {/* design/AJUSTES-1.md §B — literal 44px/800/-0.035em h1, no
              gradient accent (the mockup's h2 is plain text). Smaller on
              mobile since the doc only specifies one reference size.
              §6.2 — punto final coral: es el remate de titular de
              kayak.com y encaja con el naming de marca sin copiarle un
              solo color. El gradiente sobre la palabra destacada que §6.2
              manda eliminar ya no existía acá. */}
          <h1 className="font-heading text-[28px] font-extrabold leading-[1.1] tracking-[-0.035em] text-foreground sm:text-[44px]">
            {t("home.hero.headline")}
            <span className="text-brand-cta">.</span>
          </h1>
          {/* 2026-09-04 feedback (ronda 5) — "el titulo... que quede en un
              renglon si hay lugar": `max-w-3xl` (768px) was narrower than
              the tagline needs at the sizes people actually use — it wraps
              to 2-3 lines even though the section's own container
              (`max-w-[1180px]` above) has plenty of room for one. Dropping
              the cap lets it use that same width and wrap only when the
              viewport genuinely doesn't have the room, not before. */}
          <p className="mt-3 max-w-none text-[15px] leading-relaxed text-muted-foreground sm:text-[17px]">
            {t("home.hero.tagline")}
          </p>
        </div>
      </div>
    </section>
  );
}
