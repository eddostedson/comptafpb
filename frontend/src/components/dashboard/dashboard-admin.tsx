'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from './dashboard-layout';
import { apiClient } from '@/lib/api-client';

export default function DashboardAdmin() {
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

  const statsData = [
    {
      title: 'Centres de Santé',
      value: isLoading ? '...' : stats.centres.toLocaleString('fr-FR'),
      icon: Building2,
      description: 'Centres actifs',
      href: '/centres',
    },
    {
      title: 'Régisseurs',
      value: isLoading ? '...' : stats.regisseurs.toLocaleString('fr-FR'),
      icon: Users,
      description: 'Régisseurs actifs',
      href: '/regisseurs',
    },
    {
      title: 'OP en attente',
      value: '1,234',
      icon: FileText,
      description: 'À valider',
      href: '/op',
    },
    {
      title: 'Budget total',
      value: '12.5M FCFA',
      icon: TrendingUp,
      description: 'Budget consolidé',
      href: '/budget',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenue, {session?.user.name || 'Administrateur'}
          </h1>
          <p className="text-muted-foreground">Vue d&apos;ensemble nationale</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.href} className="block">
                <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer border-2 hover:border-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                    <p className="text-xs text-blue-500 mt-1">Cliquez pour voir les détails →</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tableau de bord en construction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les graphiques et statistiques détaillées seront disponibles dans le Module 5.
            </p>
            <div className="mt-4 space-x-2">
              <Link href="/centres" className="inline-block">
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                  Voir les Centres
                </button>
              </Link>
              <Link href="/regisseurs" className="inline-block">
                <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                  Voir les Régisseurs
                </button>
              </Link>
              <Link href="/admin/chefs-centres" className="inline-block">
                <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                  Voir les Chefs de Centres
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

