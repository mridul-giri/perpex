"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setAuthData } from "@/lib/auth";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo-account";
import { apiFetch } from "@/lib/http";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const signIn = async (credentials: { email: string; password: string }) => {
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch<{ userId: string; token: string }>(
        "/auth/signin",
        { method: "POST", body: credentials },
      );
      setAuthData(res.token, res.userId);
      router.push("/trade/BTC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void signIn({ email, password });
  };

  const onUseDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    void signIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
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
        {error && (
          <p className="rounded-md bg-[rgb(253_75_78_/_0.12)] px-3 py-2 text-xs text-down">
            {error}
          </p>
        )}
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
