import type { Metadata } from "next";
import "./globals.css";
import NetworkStatusObserver from "@/components/NetworkStatusObserver";

export const metadata: Metadata = {
  title: "Braudle | Your AI Tutor",
  description: "Master any subject with your personal AI tutor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <NetworkStatusObserver />
      </body>
    </html>
  );
}
