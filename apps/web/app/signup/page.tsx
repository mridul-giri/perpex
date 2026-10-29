"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthButton, AuthField } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { ErrorNotice } from "@/components/ui/error-notice";
import { DEMO_ACCOUNT, signIn, signUp } from "@/lib/api/auth";

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
      await signUp({ name, email, password });
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
      await signIn(DEMO_ACCOUNT);
      router.push("/trade/BTC");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Trade BTC, ETH and SOL perpetuals with up to 50x leverage."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-medium text-ink underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <ErrorNotice message={error} />
        <AuthField
          label="Name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
          autoComplete="name"
        />
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
          hint="8 to 50 characters."
          type="password"
          required
          minLength={8}
          maxLength={50}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <AuthField
          label="Confirm password"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <div className="mt-1 flex flex-col gap-3">
          <AuthButton type="submit" disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
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
