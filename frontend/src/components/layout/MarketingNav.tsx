import { Link } from "react-router-dom";
import { Cloud } from "lucide-react";

export function MarketingNav() {
  return (
    <nav className="mx-auto flex w-full max-w-3xl items-center justify-between rounded-full border border-border bg-surface/70 px-4 py-2.5 backdrop-blur-md">
      <Link to="/" className="flex items-center gap-2 pl-2">
        <Cloud className="h-4 w-4 text-accent" />
        <span className="text-sm font-semibold tracking-tight text-text">CloudClean</span>
      </Link>
      <div className="hidden items-center gap-6 text-sm text-text-dim md:flex">
        <a href="#solutions" className="hover:text-text">Solutions</a>
        <a href="#products" className="hover:text-text">Products</a>
        <a href="#pricing" className="hover:text-text">Pricing</a>
        <a href="#faq" className="hover:text-text">FAQ</a>
      </div>
      <Link
        to="/signup"
        className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-200"
      >
        Try Now
      </Link>
    </nav>
  );
}
