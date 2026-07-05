import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Cloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLogin } from "@/hooks/queries";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          localStorage.setItem("cloudclean_token", data.token);
          navigate("/app/dashboard");
        },
      }
    );
  }

  return (
    <div className="glow-radial flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2">
          <Cloud className="h-5 w-5 text-accent" />
          <span className="text-sm font-semibold text-text">CloudClean</span>
        </Link>
        <div className="glass-panel rounded-xl p-6">
          <h1 className="text-lg font-semibold text-text">Welcome back</h1>
          <p className="mt-1 text-sm text-text-dim">Sign in to manage your AWS accounts.</p>
          <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
            <Input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {login.isError && (
              <p className="text-xs text-risk-high">
                {(login.error as any)?.response?.data?.detail ?? "Incorrect email or password"}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-text-faint">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
