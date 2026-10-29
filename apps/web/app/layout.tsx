import type { Metadata } from "next";
import { Reddit_Mono, Roboto_Mono } from "next/font/google";
import "./globals.css";

const redditMono = Reddit_Mono({
  variable: "--font-reddit-mono",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
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
      className={`${redditMono.variable} ${robotoMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-ground text-ink">{children}</body>
    </html>
  );
}
