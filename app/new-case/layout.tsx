import type { Metadata } from "next";

export const metadata: Metadata = { title: "New case", robots: { index: false, follow: false } };

export default function NewCaseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
