"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthButton, AuthField } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ErrorNotice } from "@/components/ui/error-notice";
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
      title="Welcome back"
      subtitle="Log in to open the terminal and pick up where you left off."
      footer={
        <>
          New to perpex?{" "}
          <Link
            href="/signup"
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <ErrorNotice message={error} />
        <AuthField
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <AuthField
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className="mt-1 flex flex-col gap-3">
          <AuthButton type="submit" disabled={loading}>
            {loading ? "Logging in…" : "Log in"}
          </AuthButton>
          <AuthButton
            variant="secondary"
            disabled={loading}
            onClick={onUseDemo}
          >
            Try the demo account
          </AuthButton>
        </div>
      </form>
    </AuthShell>
  );
}
