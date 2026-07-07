import { Link } from "react-router-dom";
import {
  Sparkles,
  Network,
  BrainCircuit,
  ClipboardList,
  Activity,
  FileBarChart,
  Server,
  Database,
  HardDrive,
  Globe2,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";

const marqueeWords = [
  "Multi-Region Scanning",
  "Dependency Graphs",
  "Smart Recommendations",
  "Dry Run Cleanup",
  "Real AWS Data",
];

// Each card states an actual rule of the recommendation engine
// (see backend/app/aws/scanner.py) — the confidence numbers are the
// real constants the engine assigns, not marketing copy.
const showcase = [
  { label: "EC2 stopped", sub: "Terminate · confidence grows with days stopped", icon: Server, from: "from-violet-500", to: "to-indigo-500" },
  { label: "S3 bucket empty", sub: "Delete · 90% confidence", icon: Database, from: "from-blue-500", to: "to-cyan-500" },
  { label: "3+ dependents", sub: "Risk automatically rated HIGH", icon: ShieldAlert, from: "from-rose-500", to: "to-orange-400" },
  { label: "Lambda idle 30 days", sub: "Delete · 92% confidence", icon: Zap, from: "from-amber-500", to: "to-yellow-400" },
  { label: "EBS unattached", sub: "Delete · 88% confidence", icon: HardDrive, from: "from-emerald-500", to: "to-teal-400" },
  { label: "Elastic IP unattached", sub: "Release · 95% confidence", icon: Globe2, from: "from-fuchsia-500", to: "to-pink-400" },
  { label: "Cost trend", sub: "Every point is a real recorded scan", icon: FileBarChart, from: "from-indigo-500", to: "to-blue-400" },
  { label: "Dry run first", sub: "Preview deletes nothing", icon: ClipboardList, from: "from-purple-500", to: "to-violet-400" },
  { label: "Dependency edges", sub: "EC2 → EBS · EC2 → SG · EC2 → EIP", icon: Network, from: "from-cyan-500", to: "to-sky-400" },
  { label: "Live scan in progress", sub: "status: scanning → connected", icon: Activity, from: "from-orange-500", to: "to-amber-400" },
];

const steps = [
  {
    title: "Connect your account",
    desc: "Assume a least-privilege IAM role via STS — no long-lived access keys ever touch our servers.",
  },
  {
    title: "Scan & discover",
    desc: "Real boto3 calls across regions map your resources and how they depend on each other.",
  },
  {
    title: "Clean with confidence",
    desc: "Dry-run the plan, review dependency warnings, then execute — with a PDF report of exactly what happened.",
  },
];

const features = [
  { title: "Multi-Region Scanner", desc: "Real boto3 calls across 4 regions covering EC2, EBS, Elastic IPs, Security Groups, S3, Lambda, and RDS.", icon: Sparkles },
  { title: "Dependency Graph Engine", desc: "See exactly what breaks before you delete anything.", icon: Network },
  { title: "Smart Recommendations", desc: "Confidence-scored suggestions: terminate, delete, release — with the reasoning behind each one.", icon: BrainCircuit },
  { title: "Cleanup Planner & Dry Run", desc: "Preview the full plan, estimated savings, and warnings before a single resource is touched.", icon: ClipboardList },
  { title: "Async Live Scanning", desc: "Scans run in the background against real AWS APIs — the UI never blocks while it works.", icon: Activity },
  { title: "PDF Reports & History", desc: "Every cleanup logged with a downloadable report: who, what, when, and how much you saved.", icon: FileBarChart },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="bg-[#1e1b3a] px-4 py-2 text-center text-xs text-white/90">
        Live demo — this scans a real AWS account, not a mock. ✦ No credit card, no fake data.
      </div>

      <MarketingNav />

      <div className="glow-radial pointer-events-none absolute inset-x-0 top-0 h-[600px]" />

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16 pt-16">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-text sm:text-5xl">
              Find waste, understand risk,
              <br />
              <span className="gradient-text">clean AWS</span> with confidence.
            </h1>
            <p className="mt-5 max-w-lg text-base text-text-dim">
              CloudClean scans your AWS account across regions, maps what depends on what,
              and shows you the safe way to cut your bill.
            </p>

            <div className="mt-7 flex items-center gap-3">
              <Link
                to="/signup"
                className="gradient-bg rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                Get started free
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-border bg-surface px-6 py-2.5 text-sm font-medium text-text hover:border-border-hover"
              >
                How it works
              </a>
            </div>
            <p className="mt-3 text-xs text-text-faint">
              Scans a real AWS account via a read-only cross-account IAM role — no access keys.
            </p>
          </div>

          <div className="relative mx-auto h-80 w-full max-w-md">
            <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-violet-200 to-blue-200 opacity-60 blur-2xl" />
            <div className="absolute left-4 top-2 flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg">
              <Server className="h-7 w-7" />
              <span className="text-[11px] font-medium">EC2</span>
            </div>
            <div className="absolute right-2 top-8 flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg">
              <Database className="h-6 w-6" />
              <span className="text-[11px] font-medium">S3</span>
            </div>
            <div className="absolute bottom-4 left-10 flex h-24 w-24 flex-col items-center justify-center gap-1.5 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-lg">
              <Network className="h-6 w-6" />
              <span className="text-[11px] font-medium">Graph</span>
            </div>
            <div className="absolute bottom-0 right-6 flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-pink-400 text-white shadow-lg">
              <BrainCircuit className="h-7 w-7" />
              <span className="text-[11px] font-medium">Insights</span>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden border-y border-border bg-surface py-5">
        <div className="marquee-track gap-10 text-2xl font-semibold text-border-hover">
          {[...marqueeWords, ...marqueeWords].map((w, i) => (
            <span key={i} className="flex items-center gap-3 whitespace-nowrap">
              <Sparkles className="h-5 w-5 text-accent" />
              <span className="gradient-text">{w}</span>
            </span>
          ))}
        </div>
      </section>

      <section id="showcase" className="relative z-10 mx-auto max-w-6xl px-6 py-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">The rules engine</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-text">
          What the scanner flags
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-text-dim">
          These are the engine's actual detection rules and the real confidence scores it assigns —
          taken straight from the scanner's source code.
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {showcase.map((s) => (
            <div
              key={s.label}
              className={`flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl bg-gradient-to-br ${s.from} ${s.to} p-4 text-center text-white shadow-md transition-transform hover:-translate-y-1`}
            >
              <s.icon className="h-7 w-7" />
              <span className="text-xs font-semibold leading-tight">{s.label}</span>
              <span className="text-[10px] text-white/80">{s.sub}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="relative z-10 mx-auto max-w-5xl px-6 py-20">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-text">
          How <span className="gradient-text">CloudClean</span> works
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="gradient-bg mx-auto flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white shadow-md">
                {i + 1}
              </div>
              <h3 className="mt-4 text-sm font-semibold text-text">{s.title}</h3>
              <p className="mt-2 text-sm text-text-dim">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="solutions" className="relative z-10 mx-auto max-w-4xl px-6 pb-28">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-text">
          Built for Engineers.
          <br />
          Ready for Teams.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-8 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <f.icon className="h-4.5 w-4.5" />
              </div>
              <h3 className="text-sm font-medium text-text">{f.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-text-dim">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border px-4 py-8 text-center text-xs text-text-faint">
        © {new Date().getFullYear()} CloudClean. An intelligent AWS resource lifecycle & cost management platform.
      </footer>
    </div>
  );
}
