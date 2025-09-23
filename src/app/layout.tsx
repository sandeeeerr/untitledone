import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import 'gridstack/dist/gridstack.min.css';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ReactQueryProvider } from '@/components/atoms/react-query-provider';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/atoms/theme-provider';

const geistSans = localFont({
  src: '../fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: '../fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: 'UntitledOne – Music collaboration platform',
    template: '%s · UntitledOne',
  },
  description: 'Open-source platform for audio creatives to collaborate remotely with file sharing, time-based feedback, and lightweight project management.',
  applicationName: 'UntitledOne',
  authors: [{ name: 'UntitledOne' }],
  keywords: ['music collaboration', 'audio', 'file sharing', 'feedback', 'versions', 'producers', 'djs', 'audio creatives'],
  openGraph: {
    type: 'website',
    siteName: 'UntitledOne',
    title: 'UntitledOne – Music collaboration platform',
    description: 'Collaborate remotely with file sharing, time-based feedback, and project management – built for audio creatives.',
    url: '/',
    images: [
      {
        url: '/images/ss_light.png',
        width: 1200,
        height: 630,
        alt: 'UntitledOne app preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UntitledOne – Music collaboration platform',
    description: 'Collaborate remotely with file sharing, time-based feedback, and project management – built for audio creatives.',
    images: ['/images/ss_light.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ReactQueryProvider>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </NextIntlClientProvider>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
} 