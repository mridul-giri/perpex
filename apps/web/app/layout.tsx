import type { Metadata } from "next";
import { Inter, VT323 } from "next/font/google";
import { BalanceProvider } from "@/components/balance/balance-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "perpex — Trading Terminal",
  description:
    "Perpetual-futures trading terminal for the perpex exchange. Live market, order book, and leveraged order entry.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${vt323.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ground text-ink">
        <BalanceProvider>{children}</BalanceProvider>
      </body>
    </html>
  );
}
