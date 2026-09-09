import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RefundRoute — Find the right recovery route",
  description: "Identify unexpected charges, check your evidence and follow the right refund process without connecting your bank account.",
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
