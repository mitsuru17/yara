import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "YARA · Seguridad Ciudadana", template: "%s · YARA" },
  description:
    "Plataforma de prevención y alertas de seguridad ciudadana para Lima Metropolitana.",
};

export const viewport: Viewport = {
  themeColor: "#0b4fe0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-PE" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
