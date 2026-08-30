import { BusinessSection } from "@/sections/BusinessSection";
import { WidgetTeaserSection } from "@/sections/WidgetTeaserSection";

/** design/Mangomundi 4 - Final.dc.html (line 191: "1.5fr 1fr") — "For
 *  business" and the widget teaser sit side by side in one row, not as
 *  two separate full-width sections stacked on top of each other. */
export function BusinessWidgetRow() {
  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-stretch gap-6 lg:grid-cols-[1.5fr_1fr]">
          <BusinessSection />
          <WidgetTeaserSection />
        </div>
      </div>
    </section>
  );
}
