import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import GlossaryDrawer from "@/components/GlossaryDrawer";
import LayoutChrome from "@/components/LayoutChrome";
import PageEnter from "@/components/PageEnter";
import { ToastProvider } from "@/components/Toast";
import { APP_DESCRIPTION, APP_TITLE } from "@/lib/strings";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

const inter = Inter({
  subsets: ["greek", "latin"],
  variable: "--font-inter",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
};

export default function RootLayout({ children }) {
  return (
    <html lang="el" data-theme="light" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className={`app-body ${inter.variable} ${geistMono.variable}`}>
        <div className="bg-ambient" aria-hidden="true" />
        <ToastProvider>
          <a href="#main-content" className="skip-link">
            Μετάβαση στο κύριο περιεχόμενο
          </a>
          <LayoutChrome>
            <PageEnter>{children}</PageEnter>
          </LayoutChrome>
          <GlossaryDrawer />
        </ToastProvider>
      </body>
    </html>
  );
}
