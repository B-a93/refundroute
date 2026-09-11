import type { Metadata } from "next";
import "./globals.css";

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
  },
  twitter: {
    card: "summary",
    title: "MyResolveCenter | Find the Right Refund Route",
    description: "Guided refund help without connecting your bank account.",
  },
  category: "consumer services",
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
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "MyResolveCenter",
              url: "https://myresolvecenter.com",
              email: "contact@myresolvecenter.com",
              description: "Guided refund help for online subscriptions and purchases.",
            }).replace(/</g, "\\u003c"),
          }}
        />
        {children}
      </body>
    </html>
  );
}
