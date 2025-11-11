import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JNP Admin Dashboard",
  description: "Dashboard d'administration JNP Station Service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-gray-50">
        {children}
      </body>
    </html>
  );
}
