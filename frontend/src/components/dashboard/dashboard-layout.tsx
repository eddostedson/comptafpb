'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-primary">CGCS</h1>
            <p className="text-xs text-muted-foreground">
              Comptabilité de Gestion des Centres de Santé
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">{session?.user.name}</p>
                <p className="text-xs text-muted-foreground">{session?.user.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

