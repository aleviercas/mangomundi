import { BusinessSection } from "@/sections/BusinessSection";
import { WidgetTeaserSection } from "@/sections/WidgetTeaserSection";

/** design/Mangomundi 4 - Final.dc.html (line 191: "1.5fr 1fr") — "For
 *  business" and the widget teaser sit side by side in one row, not as
 *  two separate full-width sections stacked on top of each other. */
export function BusinessWidgetRow() {
  // 2026-08-31 feedback — "los espacios en general deberían estar más
  // compactos" vs. design/Mangomundi 4 - Final.dc.html: this row is
  // `padding:38px 30px` there (mockup line 191); py-14 sm:py-20 ran looser
  // on both breakpoints.
  return (
    <section className="py-9 sm:py-12">
      {/* 2026-09-04 feedback (ronda 6, cont.) — ver AboutManifestoSection:
          tope de ancho subido a 1340px, medido en vivo contra kayak.com. */}
      <div className="mx-auto max-w-[1340px] px-5 sm:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.5fr_1fr]">
          <BusinessSection />
          <WidgetTeaserSection />
        </div>
      </div>
    </section>
  );
}
