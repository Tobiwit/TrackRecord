import type { Metadata, Viewport } from "next";
import { Playfair_Display, Lora, Caveat } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
});

export const metadata: Metadata = {
  title: "Track Record",
  description: "you could write songs about this bs — a private dating archive for you and your closest friends.",
};

export const viewport: Viewport = {
  themeColor: "#1d1813",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${lora.variable} ${caveat.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
