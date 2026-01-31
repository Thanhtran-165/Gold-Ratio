import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gold Ratio Analytics",
  description: "Precious metals & macro ratios analysis tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
