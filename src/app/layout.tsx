import type { Metadata } from "next";
import Link from 'next/link';
import { Geist, Geist_Mono } from "next/font/google";
import AppHeader from "./shared/components/layouts/AppHeader";
import AppMenu from "./shared/components/layouts/AppMenu";
import AppFooter from "./shared/components/layouts/AppFooter";
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
  title: "CYK Planning Poker",
  description: "A collaborative tool for planning poker sessions",
};

/*
* component.
* This is the root layout for the application.
*/
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /*
  *
  */
  const _config = {};
  
  //
  const _helpers = {
    getTest: () => {}
  };

  //
  const _actions = {};

  /*
  * component return.
  */
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* App-Header */}
        <AppHeader />

        {/* Main Content */}
        <div style={{ display: 'flex', flex: 1 }}>
          {/* App-Menu */}
          <AppMenu />
          {/* Main Content */}
          <main style={{ flex: 1, padding: '0.5rem', backgroundColor: 'darkgrey' }}>{children}</main>
        </div>

        {/* Footer */}
        <AppFooter />
      </body>
    </html>
  );
}
