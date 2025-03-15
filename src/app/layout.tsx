import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ShopEMX - Система документооборота',
  description:
    'Система документооборота по продаже и покупке интеллектуальной собственности',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <main className="flex-grow pb-12">{children}</main>
        <footer className="py-2 text-center text-sm text-muted-foreground border-t fixed bottom-0 w-full bg-background">
          <div className="container mx-auto">
            <p>
              © {new Date().getFullYear()} ShopEMX. Разработка сайтов{' '}
              <a
                href="https://biveki.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                BivekiGroup (biveki.ru)
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
