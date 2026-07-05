import { Link } from "react-router-dom";
import {
  Sparkles,
  Network,
  BrainCircuit,
  ClipboardList,
  CalendarClock,
  FileBarChart,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";

const logos = ["awslogo", "acme", "nimbus", "orbitpay", "hexafirm", "vertexio"];

const features = [
  {
    title: "Multi-Region Scanner",
    desc: "Scans 30+ AWS services across every region in minutes — EC2, Lambda, RDS, S3, VPC, and more.",
    icon: Sparkles,
  },
  {
    title: "Dependency Graph Engine",
    center: true,
    desc: "See exactly what breaks before you delete anything.",
    icon: Network,
  },
  {
    title: "Smart Recommendations",
    desc: "Confidence-scored suggestions: terminate, delete, release — with the reasoning behind each one.",
    icon: BrainCircuit,
  },
  {
    title: "Cleanup Planner & Dry Run",
    desc: "Preview the full plan, estimated savings, and warnings before a single resource is touched.",
    icon: ClipboardList,
  },
  {
    title: "Scheduled Cleanup",
    desc: "Automate recurring cleanups by tag, environment, or age — powered by EventBridge.",
    icon: CalendarClock,
  },
  {
    title: "PDF Reports & History",
    desc: "Every cleanup logged with a downloadable report: who, what, when, and how much you saved.",
    icon: FileBarChart,
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="glow-radial pointer-events-none absolute inset-x-0 top-0 h-[600px]" />

      <div className="relative z-10 px-4 pt-6">
        <MarketingNav />
      </div>

      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-10 pt-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Find waste, understand risk,
          <br />
          clean AWS with confidence.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm text-text-dim sm:text-base">
          CloudClean scans every region and service, maps what depends on what,
          and shows you the safe way to cut your AWS bill.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <Link
            to="/signup"
            className="rounded-md bg-surface-2 px-5 py-2.5 text-sm font-medium text-text border border-border-hover hover:border-accent-dim"
          >
            Connect an AWS account
          </Link>
          <Link
            to="/app/dashboard"
            className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200"
          >
            View Live Demo
          </Link>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-3xl px-4 pb-24">
        <div className="glass-panel rounded-xl">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs text-text-faint">Scan your account...</span>
          </div>
          <div className="mono-scroll overflow-x-auto px-4 py-4 font-mono text-xs leading-relaxed text-text-dim">
            <div className="text-text-faint"># Resources found in us-east-1</div>
            <div>
              <span className="text-accent-2">Deleting EC2</span> i-0af31cd9 will also affect:
            </div>
            <div className="pl-4 text-risk-low">✓ EBS Volume vol-0912bd</div>
            <div className="pl-4 text-risk-low">✓ Elastic IP 34.201.88.12</div>
            <div className="pl-4 text-risk-low">✓ Security Group sg-04af21</div>
            <div className="mt-1">
              Risk: <span className="text-risk-high font-semibold">HIGH</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-dim">
              ✓ Dependency Graph
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-dim">
              ✓ Dry Run
            </span>
            <span className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-text-dim">
              ✓ Confidence Scoring
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-20 text-center">
        <p className="mb-6 text-xs uppercase tracking-wide text-text-faint">
          Built for teams running real AWS workloads
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-50">
          {logos.map((l) => (
            <span key={l} className="text-sm font-medium text-text-dim">
              {l}
            </span>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-4 pb-28">
        <h2 className="text-center text-3xl font-semibold tracking-tight text-white">
          Built for Engineers.
          <br />
          Ready for Teams.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-surface p-5"
            >
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
