import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DebateLab",
  description:
    "Track your debate profile, friends, learning videos, and competitions.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
