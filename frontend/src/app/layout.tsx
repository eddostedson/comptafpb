import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CGCS - Comptabilité de Gestion des Centres de Santé',
  description: 'Application de gestion comptable et budgétaire pour les centres de santé',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}

