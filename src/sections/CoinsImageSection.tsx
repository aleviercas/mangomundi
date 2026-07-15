/** Standalone visual break between the About/Manifesto section and Market
 *  Coverage — no text, just the currency/globe image at the same size used
 *  elsewhere on the page, for visual rhythm. */
export function CoinsImageSection() {
  return (
    <section className="py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <img
          src="/images/about-coins-globe.jpg"
          alt=""
          width={1120}
          height={610}
          className="mx-auto aspect-[16/9] w-full max-w-4xl rounded-2xl object-cover shadow-[0_16px_40px_-20px_rgba(15,23,42,0.3)]"
          loading="lazy"
        />
      </div>
    </section>
  );
}
