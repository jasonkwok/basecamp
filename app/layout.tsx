import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Basecamp — WIP",
  description: "Your next mountain adventure starts here. Basecamp is a work in progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
