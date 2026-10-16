import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DebateLab",
  description:
    "Practice debates, track your results, and watch debate lessons.",
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
