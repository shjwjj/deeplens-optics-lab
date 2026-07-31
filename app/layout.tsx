import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shjwjj.github.io/deeplens-optics-lab/"),
  title: "DeepLens 光学设计学习实验室",
  description: "用真实计算图看懂光圈、点列图、MTF、畸变与渐晕，以及它们对照片的影响。",
  openGraph: {
    title: "DeepLens 光学设计学习实验室",
    description: "零基础看懂光圈、点列图、MTF、畸变与渐晕。",
    images: ["https://shjwjj.github.io/deeplens-optics-lab/og.png"],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepLens 光学设计学习实验室",
    description: "零基础看懂光圈、点列图、MTF、畸变与渐晕。",
    images: ["https://shjwjj.github.io/deeplens-optics-lab/og.png"],
  },
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
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
