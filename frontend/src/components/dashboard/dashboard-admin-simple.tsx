'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from './dashboard-layout';
import { apiClient } from '@/lib/api-client';

export default function DashboardAdminSimple() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    centres: 0,
    regisseurs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = (session as any)?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const centresRes = await apiClient.get('/admin/centres', { headers });
        const regisseursRes = await apiClient.get('/admin/regisseurs', { headers });

        setStats({
          centres: Array.isArray(centresRes.data) ? centresRes.data.length : 0,
          regisseurs: Array.isArray(regisseursRes.data) ? regisseursRes.data.length : 0,
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadStats();
    }
  }, [session]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenue, {session?.user.name || 'Administrateur'}
          </h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble nationale</p>
        </div>

        {/* Tuiles cliquables simplifiées */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          
          {/* Centres de Santé */}
          <Link href="/centres" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-blue-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Centres de Santé</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.centres.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-muted-foreground">Centres actifs</p>
                <p className="text-xs text-blue-500 mt-1">Cliquez ici →</p>
              </CardContent>
            </Card>
          </Link>

          {/* Régisseurs */}
          <Link href="/regisseurs" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-green-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Régisseurs</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{isLoading ? '...' : stats.regisseurs.toLocaleString('fr-FR')}</div>
                <p className="text-xs text-muted-foreground">Régisseurs actifs</p>
                <p className="text-xs text-green-500 mt-1">Cliquez ici →</p>
              </CardContent>
            </Card>
          </Link>

          {/* OP en attente */}
          <Link href="/op" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-yellow-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OP en attente</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">À valider</p>
                <p className="text-xs text-yellow-500 mt-1">Cliquez ici →</p>
              </CardContent>
            </Card>
          </Link>

          {/* Budget total */}
          <Link href="/budget" className="block">
            <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-purple-500 bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Budget total</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12.5M XAF</div>
                <p className="text-xs text-muted-foreground">Budget consolidé</p>
                <p className="text-xs text-purple-500 mt-1">Cliquez ici →</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Boutons de test supplémentaires */}
        <Card>
          <CardHeader>
            <CardTitle>Test des Liens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/centres">
                <button className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Centres
                </button>
              </Link>
              <Link href="/regisseurs">
                <button className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                  Régisseurs
                </button>
              </Link>
              <Link href="/op">
                <button className="w-full px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors">
                  OP
                </button>
              </Link>
              <Link href="/budget">
                <button className="w-full px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors">
                  Budget
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tableau de bord en construction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les graphiques et statistiques détaillées seront disponibles dans le Module 5.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}




