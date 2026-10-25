import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Budget Oracle — Algorithmic Evidence Purchasing Agent',
  description:
    'An AI research agent that buys evidence only when it is worth the price, governed by deterministic spending and probability rules.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} dark`}>
      <body className="min-h-screen bg-black text-[#f4f4f0] antialiased selection:bg-[#ccff4d] selection:text-black">
        {children}
      </body>
    </html>
  );
}
