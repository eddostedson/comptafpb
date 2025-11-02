'use client';

import { useSession } from 'next-auth/react';
import { Home, Building2, Users, FileText, TrendingUp, Activity } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopBar from './top-bar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: 'Accueil', href: '/home', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: Activity },
    { name: 'Centres', href: '/centres', icon: Building2 },
    { name: 'Régisseurs', href: '/regisseurs', icon: Users },
    { name: 'Divisions Admin', href: '/admin/divisions-administratives', icon: Building2, adminOnly: true },
    { name: 'Budget', href: '/budget', icon: TrendingUp },
    { name: 'Ordres de Paiement', href: '/op', icon: FileText },
    { name: 'NBE', href: '/nbe', icon: Building2 },
  ];

  // Filtrer la navigation selon le rôle
  const filteredNavigation = navigation.filter((item) => {
    if (item.href === '/centres' && session?.user.role === 'CHEF_CENTRE') {
      return false; // Les chefs de centre n'ont pas accès à la liste de tous les centres
    }
    if (item.href === '/regisseurs' && session?.user.role !== 'ADMIN') {
      return false; // Seuls les admins voient la liste des régisseurs
    }
    if (item.href === '/nbe' && session?.user.role !== 'ADMIN') {
      return false; // Seuls les admins voient la NBE
    }
    if ((item as any).adminOnly && session?.user.role !== 'ADMIN') {
      return false; // Masquer les éléments adminOnly pour les non-admins
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar avec infos utilisateur */}
      <TopBar />

      {/* Navigation horizontale */}
      <nav className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (pathname?.startsWith(item.href) && item.href !== '/home');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-8rem)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {children}
      </main>
    </div>
  );
}

