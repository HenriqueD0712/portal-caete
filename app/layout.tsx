import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const svarge = localFont({
  src: "./fonts/Svarge.ttf",
  variable: "--font-svarge",
});

const foundersGrotesk = localFont({
  src: [
    { path: "./fonts/FoundersGrotesk-Light.otf", weight: "300", style: "normal" },
    { path: "./fonts/FoundersGrotesk-LightItalic.otf", weight: "300", style: "italic" },
    { path: "./fonts/FoundersGrotesk-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/FoundersGrotesk-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "./fonts/FoundersGrotesk-Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/FoundersGrotesk-MediumItalic.otf", weight: "500", style: "italic" },
    { path: "./fonts/FoundersGrotesk-Semibold.otf", weight: "600", style: "normal" },
    { path: "./fonts/FoundersGrotesk-SemiboldItalic.otf", weight: "600", style: "italic" },
    { path: "./fonts/FoundersGrotesk-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/FoundersGrotesk-BoldItalic.otf", weight: "700", style: "italic" },
  ],
  variable: "--font-founders-grotesk",
});

export const metadata: Metadata = {
  title: "Estúdio Caeté | Portal",
  description: "Portal de clientes - Estúdio Caeté",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Caeté",
  },
};

export const viewport: Viewport = {
  themeColor: "#2C4035",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${svarge.variable} ${foundersGrotesk.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
