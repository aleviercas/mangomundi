import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { TrustBox } from "@/components/TrustBox";

/** Full-bleed dark band (design/HANDOFF.md §6): about-coins-globe.jpg behind
 *  the manifesto copy, with market-coverage numbers folded in on the right
 *  instead of living in their own StatsSection further down the page — one
 *  credibility beat instead of two near-identical light sections back to
 *  back.
 *
 *  design/AJUSTES-2.md §5 (mockup line 169-186) only calls out the grid
 *  ratio, the stat-tile styling and the two CTA buttons — not the
 *  eyebrow/title/subtitle copy or their sizing, which AJUSTES-1 §F already
 *  set deliberately, so those stay untouched here.
 *
 *  2026-08-30 feedback: /how-we-make-money is gone (no real copy backed
 *  it, and the "Read our method" button along with it) — this band goes
 *  back to a single "About us" button, pointing at /about. The 4th stat
 *  tile drops the hardcoded "4.6" (never a real Trustpilot number — see
 *  TrustpilotCard's own comment) for "Founded in 2026", a real fact
 *  instead of an unverifiable one. */
export function AboutManifestoSection() {
  const { t } = useI18n();
  // Providers stays "50+": no single real total-active-providers count
  // exists server-side today (getProviderCounts only returns segment-split
  // retail/business counts, which double-count providers marked "both"),
  // so this is the safe generic fallback decision #7 of this redesign
  // already established for exactly this situation.
  const stats: { value: string; label: string; valueClassName?: string }[] = [
    { value: "150+", label: t("home.stats.countries") },
    { value: "100+", label: t("home.stats.currencies") },
    { value: "50+", label: t("home.stats.providers") },
    { value: "2026", label: t("home.stats.founded") },
  ];
  return (
    <section
      id="about"
      // 2026-08-31 feedback — "los espacios en general deberían estar más
      // compactos" vs. design/Mangomundi 4 - Final.dc.html: this band is
      // `padding:46px 30px` there (mockup line 169); py-14 sm:py-20 ran
      // 10–34px looser on top of that.
      className="scroll-mt-24 relative overflow-hidden bg-[#120E0B] py-10 sm:py-14"
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url(/images/about-coins-globe.jpg)",
          backgroundPosition: "right center",
          backgroundSize: "cover",
          opacity: 0.55,
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #120E0B 12%, rgba(18,14,11,.82) 46%, rgba(18,14,11,.25) 100%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_340px] lg:gap-11">
          <div className="max-w-2xl">
            <p className="text-eyebrow font-bold uppercase text-[#FF8A6B]">
              {t("home.about.eyebrow")}
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-h2">
              {t("home.about.title")}
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/70 sm:text-lg">
              {t("home.about.subtitle")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3.5">
              <Link
                to="/about"
                className="inline-flex h-11 items-center rounded-xl bg-[#EE5B3E] px-5 text-[14px] font-bold text-white"
              >
                {t("home.about.cta.aboutUs")}
              </Link>
              {/* 2026-08-31 feedback — moved here from TodaysRoutesSection's
                  header row, next to the About us CTA. No custom card
                  around it (an earlier pass wrapped it in a white pill) —
                  Trustpilot's own widget design, unmodified.
                  2026-08-31 feedback (again) — "sigue desalineado respecto
                  al botón de about us": `items-center` on the row alone
                  wasn't enough, so a `h-11` (44px, matching the button)
                  wrapper was added around TrustBox — but its real rendered
                  height is 52px (data-style-height, see TrustBox's own
                  comment): the box declares one height and is then capped
                  8px shorter than that. TrustpilotCard hit the same
                  mismatch in the rail and reverted a similar height cap for
                  the same reason (either clips the widget with
                  overflow-hidden, or leaves the wrapper's own box shorter
                  than what actually gets painted). 2026-09-02 feedback says
                  it's still misaligned, higher than the button, with a
                  fixed h-11 in place — dropping it removes that known-bad
                  mismatch and lets the row's own `items-center` (line 74)
                  size against the widget's real 52px, same approach
                  TrustpilotCard uses successfully ("comfortable padding
                  instead of a hard height"). Not re-verified against the
                  live widget here — this sandbox has no network path to
                  trustpilot.com (confirmed again this round) and `/` 500s
                  server-side on the Supabase-backed loader other sections
                  on this same page need, so a real screenshot isn't
                  possible from here; if this still looks off in
                  production, a screenshot is the next real signal. */}
              <div className="flex shrink-0 items-center">
                <TrustBox />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            {stats.map((s) => (
              <div key={s.label} className="rounded-[14px] border border-white/14 bg-white/8 p-3.5">
                <div
                  className={`font-heading text-[26px] font-extrabold tracking-[-0.03em] ${s.valueClassName ?? "text-white"}`}
                >
                  {s.value}
                </div>
                <div className="mt-[2px] text-[11.5px] text-[#A79C92]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
