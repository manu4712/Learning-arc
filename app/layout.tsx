import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Learning Arc — Verifiable Learning Productivity",
  description: "Understand how you are growing from guided consumption toward independent application.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
