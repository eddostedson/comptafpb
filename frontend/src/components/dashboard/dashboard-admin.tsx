'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';
import DashboardLayout from './dashboard-layout';

export default function DashboardAdmin() {
  const { data: session } = useSession();

  const stats = [
    {
      title: 'Centres de Santé',
      value: '2,500',
      icon: Building2,
      description: 'Centres actifs',
    },
    {
      title: 'Régisseurs',
      value: '150',
      icon: Users,
      description: 'Régisseurs actifs',
    },
    {
      title: 'OP en attente',
      value: '1,234',
      icon: FileText,
      description: 'À valider',
    },
    {
      title: 'Budget total',
      value: '12.5M XAF',
      icon: TrendingUp,
      description: 'Budget consolidé',
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
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
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
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

