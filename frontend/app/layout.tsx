import { Metadata } from 'next';
import './globals.css';
import { VaultProvider } from '@/context/VaultContext';
import { ConnectButton } from '@/components/ConnectButton';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  other: {
    'base:app_id': '697b0fdd7a620235c741a888',
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="icon" href="/logo.png" />
        <title>LegacyVault</title>
      </head>
      <body>
        <VaultProvider>
          <header className="bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-700">
            <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="LegacyVault" className="w-10 h-10 rounded-lg" />
                <h1 className="text-xl md:text-2xl font-bold text-white">
                  LegacyVault
                </h1>
              </div>
              <ConnectButton />
            </div>
          </header>
          <main className="pb-6">{children}</main>
        </VaultProvider>
      </body>
    </html>
  );
}
