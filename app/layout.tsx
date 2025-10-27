import './globals.css';
import React from 'react';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import { CdpProvider } from '@/components/CdpProvider';
import { Providers } from './providers';
import UserNavServer from '@/components/UserNavServer';
import AdminNavLink from '@/components/AdminNavLink';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

export const metadata = { title: 'House of Voi', description: 'Fun games and rewards on the blockchain' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className={`${inter.className} min-h-screen`}>
        <Providers>
          <CdpProvider>
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
              <div className="mx-auto max-w-7xl px-6">
                <div className="flex items-center justify-between h-16">
                  <Link href="/" className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                        <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                        <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
                        <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                        <path d="M6 14h12M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <span className="font-semibold text-lg text-neutral-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        House of Voi
                      </span>
                    </div>
                  </Link>
                  <nav className="flex items-center space-x-1">
                    <Link
                      href="/"
                      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      Home
                    </Link>
                    <Link
                      href="/app/games"
                      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      Games
                    </Link>
                    <Link
                      href="/stats"
                      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      Stats
                    </Link>
                    <Link
                      href="/leaderboard"
                      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      Leaderboard
                    </Link>
                    <Link
                      href="/app"
                      className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      Dashboard
                    </Link>
                    <AdminNavLink />
                    <UserNavServer />
                  </nav>
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-7xl px-6 py-12 min-h-[calc(100vh-12rem)]">{children}</main>
            <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="text-center">
                  <div className="text-neutral-950 dark:text-white font-semibold text-xl mb-2">House of Voi</div>
                  <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-6">Fun games and rewards across multiple blockchains</p>
                  <div className="flex justify-center gap-6 text-xs text-neutral-500 dark:text-neutral-500">
                    <span>Base</span>
                    <span>•</span>
                    <span>Voi</span>
                    <span>•</span>
                    <span>Solana</span>
                  </div>
                  <p className="text-neutral-400 dark:text-neutral-600 text-xs mt-8">
                    &copy; {new Date().getFullYear()} House of Voi. Have fun!
                  </p>
                </div>
              </div>
            </footer>
          </CdpProvider>
        </Providers>
      </body>
    </html>
  );
}
