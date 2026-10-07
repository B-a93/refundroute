import type { Metadata } from "next";
import "./globals.css";
import { ReferralTracker } from "@/components/referral-tracker";

export const metadata: Metadata = {
  metadataBase: new URL("https://myresolvecenter.com"),
  title: {
    default: "MyResolveCenter | Refund Help for Online Charges",
    template: "%s | MyResolveCenter",
  },
  description: "Get guided refund help for unexpected subscription renewals, charges after cancellation and online purchases—without connecting your bank account.",
  alternates: { canonical: "/" },
  keywords: ["refund help", "subscription refund", "unexpected charge", "online purchase refund", "charged after cancellation"],
  openGraph: {
    type: "website",
    url: "/",
    siteName: "MyResolveCenter",
    title: "MyResolveCenter | Find the Right Refund Route",
    description: "Check your evidence and follow the right refund process for subscriptions and online purchases.",
    images: [{ url: "/brand/myresolvecenter-icon-512.png", width: 512, height: 512, alt: "MyResolveCenter" }],
  },
  twitter: {
    card: "summary",
    title: "MyResolveCenter | Find the Right Refund Route",
    description: "Guided refund help without connecting your bank account.",
    images: ["/brand/myresolvecenter-icon-512.png"],
  },
  category: "consumer services",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReferralTracker />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyResolveCenter",
              url: "https://myresolvecenter.com",
              email: "contact@myresolvecenter.com",
              logo: "https://myresolvecenter.com/brand/myresolvecenter-icon-512.png",
              description: "Guided refund help for online subscriptions and purchases.",
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
