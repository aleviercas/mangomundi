import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Intelligent Currency Exchange — mangoglobal" },
      { name: "description", content: "AI agent for global and local payments. Best rates for individuals and businesses." },
      { property: "og:title", content: "Intelligent Currency Exchange — mangoglobal" },
      { property: "og:description", content: "AI agent for global and local payments. Best rates for individuals and businesses." },
      { property: "og:url", content: "https://mangoglobal.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://mangoglobal.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return <HeroSection />;
}
