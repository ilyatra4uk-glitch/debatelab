import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://debatelab-smoky.vercel.app"),
  title: { default: "DebateLab | Debate practice for secondary students", template: "%s | DebateLab" },
  description:
    "DebateLab helps secondary students practise debating, receive feedback, and build confident speaking habits.",
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
