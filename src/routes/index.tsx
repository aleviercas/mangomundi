import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";
import { getRouteSeo } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => {
    const seo = getRouteSeo("en", "/");
    return { meta: [
      { title: seo.title },
      { name: "description", content: seo.description },
      { property: "og:title", content: seo.title },
      { property: "og:description", content: seo.description },
      { property: "og:url", content: "https://mangoglobal.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/" }] };
  },
  component: Index,
});

function Index() {
  return <HeroSection />;
}
