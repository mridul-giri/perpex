import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "perpex — Create account",
  description:
    "Create a perpex account and trade BTC, ETH and SOL perpetuals with up to 50x leverage.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
