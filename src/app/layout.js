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
  title: "Cat Academy - Fun Learning! 🐾",
  description: "The cutest way to learn! Master Math, Science, English and more with your furry friend.",
  manifest: "/manifest.json",
  themeColor: "#ff85b3",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Cat Academy",
  },
  icons: {
    icon: "/cat-hat-logo.png",
    apple: "/cat-hat-logo.png",
  },
};

export const viewport = {
  themeColor: "#ff85b3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/cat-hat-logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/cat-hat-logo.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
