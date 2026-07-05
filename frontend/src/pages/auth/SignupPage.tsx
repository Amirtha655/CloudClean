import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Cloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSignup, useVerify } from "@/hooks/queries";

export function SignupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const signup = useSignup();
  const verify = useVerify();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    signup.mutate({ name, email, password }, { onSuccess: () => setStep("verify") });
  }

  function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    verify.mutate({ email, code }, { onSuccess: () => navigate("/login") });
  }

  return (
    <div className="glow-radial flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Cloud className="h-5 w-5 text-accent" />
          <span className="text-sm font-semibold text-text">CloudClean</span>
        </Link>
        <div className="glass-panel rounded-xl p-6">
          {step === "form" ? (
            <>
              <h1 className="text-lg font-semibold text-text">Create your account</h1>
              <p className="mt-1 text-sm text-text-dim">Start scanning your AWS accounts for free.</p>
              <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
                {signup.isError && (
                  <p className="text-xs text-risk-high">
                    {(signup.error as any)?.response?.data?.detail ?? "Something went wrong"}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={signup.isPending}>
                  {signup.isPending ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-text">Verify your email</h1>
              <p className="mt-1 text-sm text-text-dim">
                We sent a 6-digit code to <span className="text-text">{email || "your email"}</span>.
              </p>
              <form className="mt-6 space-y-3" onSubmit={handleVerify}>
                <Input
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
                {verify.isError && (
                  <p className="text-xs text-risk-high">
                    {(verify.error as any)?.response?.data?.detail ?? "Incorrect code"}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={verify.isPending}>
                  {verify.isPending ? "Verifying…" : "Verify & continue"}
                </Button>
              </form>
            </>
          )}
          <p className="mt-5 text-center text-xs text-text-faint">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
