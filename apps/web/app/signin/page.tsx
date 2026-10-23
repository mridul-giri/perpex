"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { DEMO_ACCOUNT, signIn } from "@/lib/api/auth";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signInAndOpenTerminal = async (credentials: {
    email: string;
    password: string;
  }) => {
    setError("");
    setLoading(true);
    try {
      await signIn(credentials);
      router.push("/trade/BTC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void signInAndOpenTerminal({ email, password });
  };

  const onUseDemo = () => {
    setEmail(DEMO_ACCOUNT.email);
    setPassword(DEMO_ACCOUNT.password);
    void signInAndOpenTerminal(DEMO_ACCOUNT);
  };

  return (
    <AuthShell
      title="Log in"
      subtitle="Sign in to place orders on perpex."
      footer={
        <>
          New here?{" "}
          <Link
            href="/signup"
            className="font-medium text-accent hover:underline"
          >
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <ErrorNotice message={error} />
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Email</span>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Password</span>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="mt-1 w-full"
        >
          {loading ? "Signing in…" : "Log in"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          onClick={onUseDemo}
          className="w-full"
        >
          Use demo account
        </Button>
      </form>
    </AuthShell>
  );
}
