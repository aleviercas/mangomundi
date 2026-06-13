import { createFileRoute } from "@tanstack/react-router";
import { HeroSection } from "@/sections/HeroSection";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <HeroSection />;
}
