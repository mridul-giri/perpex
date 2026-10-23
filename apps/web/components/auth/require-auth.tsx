"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useIsClient } from "@/hooks/use-is-client";
import { isSignedIn } from "@/lib/session";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const signedIn = isClient && isSignedIn();

  useEffect(() => {
    if (isClient && !signedIn) router.replace("/signin");
  }, [isClient, signedIn, router]);

  return signedIn ? children : null;
}
