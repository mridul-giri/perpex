import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "perpex — Log in",
  description:
    "Log in to the perpex terminal to trade BTC, ETH and SOL perpetuals.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
