import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Situationship", description: "Find connections with clear expectations." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
