import { Link } from "@tanstack/react-router";
import { Wordmark } from "@/components/Wordmark";
import { LangSwitcher } from "@/components/LangSwitcher";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-[#fcfcfc]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" aria-label="mangomundi home" className="flex items-center">
          <Wordmark className="text-xl" />
        </Link>
        <LangSwitcher />
      </div>
    </header>
  );
}
