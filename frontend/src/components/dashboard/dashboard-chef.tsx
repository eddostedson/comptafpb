'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, FileText, CheckCircle, Clock } from 'lucide-react';
import DashboardLayout from './dashboard-layout';

export default function DashboardChef() {
  const { data: session } = useSession();

  const stats = [
    {
      title: 'Solde disponible',
      value: '18,500 XAF',
      icon: Wallet,
      description: 'Budget restant',
    },
    {
      title: 'OP créés',
      value: '12',
      icon: FileText,
      description: 'Ce mois',
    },
    {
      title: 'OP validés',
      value: '8',
      icon: CheckCircle,
      description: 'Par le régisseur',
    },
    {
      title: 'OP en attente',
      value: '4',
      icon: Clock,
      description: 'En cours de validation',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            Bienvenue, {session?.user.name || 'Chef de Centre'}
          </h1>
          <p className="text-muted-foreground">Gestion de votre centre</p>
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
            <CardTitle>Prochaines étapes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Les modules Budgets et OP seront disponibles dans les prochaines étapes (Modules 2 & 3).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

