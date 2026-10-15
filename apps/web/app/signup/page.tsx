"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInDemo } from "@/lib/demo-account";
import { apiFetch } from "@/lib/http";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiFetch<{ userId: string }>("/auth/signup", {
        method: "POST",
        body: { name, email, password },
      });
      router.push("/signin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const onUseDemo = async () => {
    setError("");
    setLoading(true);
    try {
      await signInDemo();
      router.push("/trade/BTC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Password: 8–50 characters."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-accent hover:underline"
          >
            Log in
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
          <span className="text-xs text-ink-muted">Name</span>
          <Input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            autoComplete="name"
          />
        </label>
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
            autoComplete="new-password"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-ink-muted">Confirm password</span>
          <Input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </label>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="mt-1 w-full"
        >
          {loading ? "Creating…" : "Create account"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={loading}
          className="w-full"
          onClick={onUseDemo}
        >
          Use demo account
        </Button>
      </form>
    </AuthShell>
  );
}
