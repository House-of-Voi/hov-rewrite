import './globals.css';
import React from 'react';
import { CdpProvider } from '@/components/CdpProvider';
import { Providers } from './providers';
import UserNav from '@/components/UserNav';

export const metadata = { title: 'House of Voi 🎰', description: 'Digital casino on the blockchain' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">
        <Providers>
        <CdpProvider>
        <header className="sticky top-0 z-50 glass-casino border-b border-gold-900/20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex items-center justify-between h-20">
              <a href="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-gradient-to-br from-gold-500 via-gold-600 to-gold-700 rounded-xl flex items-center justify-center shadow-lg shadow-gold-950/50 group-hover:shadow-gold-900/70 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-neutral-950">
                    <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="16" cy="10" r="1.5" fill="currentColor"/>
                    <path d="M6 14h12M6 17h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <span className="font-black text-xl text-gold-400 group-hover:text-gold-300 transition-colors neon-text">
                    HOUSE OF VOI
                  </span>
                </div>
              </a>
              <nav className="flex items-center space-x-2">
                <a
                  href="/"
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-gold-400 hover:bg-gold-500/5 rounded-lg transition-all tracking-wide uppercase"
                >
                  Home
                </a>
                <a
                  href="/app/games"
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-gold-400 hover:bg-gold-500/5 rounded-lg transition-all tracking-wide uppercase"
                >
                  Games
                </a>
                <a
                  href="/stats"
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-gold-400 hover:bg-gold-500/5 rounded-lg transition-all tracking-wide uppercase"
                >
                  Stats
                </a>
                <a
                  href="/leaderboard"
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-gold-400 hover:bg-gold-500/5 rounded-lg transition-all tracking-wide uppercase"
                >
                  Leaderboard
                </a>
                <a
                  href="/app"
                  className="px-5 py-2.5 text-sm font-bold text-neutral-400 hover:text-gold-400 hover:bg-gold-500/5 rounded-lg transition-all tracking-wide uppercase"
                >
                  Dashboard
                </a>
                <UserNav />
              </nav>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-6 py-12 min-h-[calc(100vh-12rem)]">{children}</main>
        <footer className="border-t border-gold-900/20 bg-neutral-950/50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="text-center">
              <div className="text-gold-400 font-black text-2xl mb-2 neon-text">HOUSE OF VOI</div>
              <p className="text-neutral-500 text-sm mb-6">Multi-Chain • Crypto Gaming</p>
              <div className="flex justify-center gap-8 text-xs text-neutral-600 uppercase tracking-wider">
                <span>Base</span>
                <span>•</span>
                <span>Voi</span>
                <span>•</span>
                <span>Solana</span>
              </div>
              <p className="text-neutral-700 text-xs mt-8">
                &copy; {new Date().getFullYear()} House of Voi. Play responsibly.
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
