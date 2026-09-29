import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PRABHATIANS — Learn from peers. Grow together.",
  description: "A student-powered learning community at Prabhat Engineering College. Connect, learn, and share what you know.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
