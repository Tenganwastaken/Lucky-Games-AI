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

export const metadata = {
  title: "Lucky Games",
  description: "Educational hub on games of chance, world map, and AI-assisted risk demo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`app-body ${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
