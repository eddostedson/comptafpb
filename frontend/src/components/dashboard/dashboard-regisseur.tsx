'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileCheck, AlertCircle, TrendingUp } from 'lucide-react';
import DashboardLayout from './dashboard-layout';

export default function DashboardRegisseur() {
  const { data: session } = useSession();

  const stats = [
    {
      title: 'Mes Centres',
      value: '23',
      icon: Building2,
      description: 'Centres supervisés',
    },
    {
      title: 'OP à valider',
      value: '47',
      icon: FileCheck,
      description: 'En attente',
    },
    {
      title: 'Alertes',
      value: '5',
      icon: AlertCircle,
      description: 'Nécessitent attention',
    },
    {
      title: 'Budget consolidé',
      value: '450K XAF',
      icon: TrendingUp,
      description: 'Total centres',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenue, {session?.user.name || 'Régisseur'}
          </h1>
          <p className="text-muted-foreground">Supervision multi-centres</p>
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
              La vue multi-centres sera disponible dans le Module 5.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

