import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";

export function MarketingNav() {
  return (
    <nav className="flex w-full items-center justify-between border-b border-border bg-surface/90 px-6 py-3.5 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2">
        <Cloud className="h-5 w-5 text-accent" />
        <span className="text-base font-semibold tracking-tight text-text">CloudClean</span>
      </Link>
      <div className="hidden items-center gap-7 text-sm font-medium text-text-dim md:flex">
        <a href="#solutions" className="hover:text-text">Solutions</a>
        <a href="#showcase" className="hover:text-text">Showcase</a>
        <a href="#how-it-works" className="hover:text-text">How it works</a>
        <a href="#faq" className="hover:text-text">FAQ</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="hidden text-sm font-medium text-text-dim hover:text-text sm:block">
          Login
        </Link>
        <Link
          to="/signup"
          className="gradient-bg rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent-dim/20 hover:opacity-90"
        >
          Try Now
        </Link>
      </div>
    </nav>
  );
}
