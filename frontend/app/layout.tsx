'use client';

import './globals.css';
import { VaultProvider } from '@/context/VaultContext';
import { ConnectButton } from '@/components/ConnectButton';
import { ReactNode } from 'react';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <VaultProvider>
          <header className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
                LegacyVault
              </h1>
              <ConnectButton />
            </div>
          </header>
          <main>{children}</main>
        </VaultProvider>
      </body>
    </html>
  );
}
