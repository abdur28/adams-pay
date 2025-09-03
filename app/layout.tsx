import type { Metadata } from "next";
import "./globals.css";
import localFont from 'next/font/local';

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
    <html lang="en">
      <body
        className={`${justSans.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}