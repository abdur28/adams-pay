import type { Metadata } from "next";
import "./globals.css";
import localFont from 'next/font/local';
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "sonner";
import { FloatingNavbar } from "@/components/floating-navbar";
import Footer from "@/components/footer";
import TransactionCountdown from "@/components/TransactionCountdown";

const justSans = localFont({
  src: [
    {
      path: './fonts/JUST Sans ExLight.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: './fonts/JUST Sans Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './fonts/JUST Sans Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/JUST Sans SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: './fonts/JUST Sans Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/JUST Sans ExBold.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  variable: '--font-just-sans',
});

export const metadata: Metadata = {
  title: "Adams Pay - Smile. Swipe. Repeat",
  description: "Fast, secure, and modern payment solutions for everyone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" >
      <head>
        <meta name="apple-mobile-web-app-title" content="Adams Pay" />
      </head>
      <body
        className={`${justSans.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <FloatingNavbar />
          <TransactionCountdown />
          {children}
          <Toaster 
            position="top-right" 
            richColors 
          />
        </AuthProvider>
      </body>
    </html>
  );
}