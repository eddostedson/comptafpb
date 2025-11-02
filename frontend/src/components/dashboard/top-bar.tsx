'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, User, LogOut, Settings, Clock, Shield, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BackendStatusIndicator } from '@/components/backend-status-indicator';

export default function TopBar() {
  const { data: session } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationsCount, setNotificationsCount] = useState(0);

  // Mettre à jour l'heure toutes les secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Formater l'heure de connexion (si disponible dans la session)
  const getLoginTime = () => {
    // Pour l'instant, on affiche l'heure actuelle
    // Plus tard, on pourra stocker l'heure de connexion dans la session
    return currentTime.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtenir le nom d'affichage du rôle
  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrateur',
      REGISSEUR: 'Régisseur',
      CHEF_CENTRE: 'Chef de Centre',
    };
    return roles[role] || role;
  };

  // Obtenir la couleur du badge selon le rôle
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-800 border-red-200',
      REGISSEUR: 'bg-green-100 text-green-800 border-green-200',
      CHEF_CENTRE: 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[role] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Générer les initiales pour l'avatar
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  // Ne pas bloquer le rendu si la session n'est pas encore chargée
  // Le composant DashboardLayout gère déjà l'authentification
  if (!session) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-4 flex-1">
            <Link href="/home" className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">CGCS</h1>
                <p className="text-xs text-slate-500 hidden md:block">
                  Comptabilité de Gestion des Centres de Santé
                </p>
              </div>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo et titre */}
        <div className="flex items-center gap-4 flex-1">
          <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">CGCS</h1>
              <p className="text-xs text-slate-500 hidden md:block">
                Comptabilité de Gestion des Centres de Santé
              </p>
            </div>
          </Link>
        </div>

        {/* Zone droite : Statut Backend, Notifications, Heure, Profil */}
        <div className="flex items-center gap-4">
          {/* Statut Backend */}
          <BackendStatusIndicator variant="compact" showLabel={true} className="hidden md:flex" />

          {/* Heure actuelle */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">{getLoginTime()}</span>
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationsCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {notificationsCount > 9 ? '9+' : notificationsCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {notificationsCount > 0 && (
                  <span className="text-xs text-slate-500">{notificationsCount} nouvelle(s)</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notificationsCount === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Aucune nouvelle notification</p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-sm text-slate-700">
                    Vous avez {notificationsCount} nouvelle(s) notification(s)
                  </p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu utilisateur */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3 hover:bg-slate-50">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                  {getInitials(session.user.name || 'U')}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-semibold text-slate-800">{session.user.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${getRoleColor(session.user.role)}`}>
                      {getRoleName(session.user.role)}
                    </Badge>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-slate-500">{session.user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className={`text-xs ${getRoleColor(session.user.role)}`}>
                      <Shield className="w-3 h-3 mr-1" />
                      {getRoleName(session.user.role)}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/home" className="flex items-center gap-2 cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>Page d&apos;accueil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

