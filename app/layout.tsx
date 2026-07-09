import type { Metadata, Viewport } from "next";
import { IM_Fell_English, IM_Fell_English_SC, EB_Garamond, Special_Elite, La_Belle_Aurore } from "next/font/google";
import "./globals.css";

const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell",
});

const fellSC = IM_Fell_English_SC({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-fell-sc",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-garamond",
});

const typewriter = Special_Elite({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-typewriter",
});

const aurore = La_Belle_Aurore({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-aurore",
});

export const metadata: Metadata = {
  title: "Track Record",
  description: "you could write songs about this bs — a private dating archive for you and your closest friends.",
};

export const viewport: Viewport = {
  themeColor: "#e6d9bc",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${fell.variable} ${fellSC.variable} ${garamond.variable} ${typewriter.variable} ${aurore.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
