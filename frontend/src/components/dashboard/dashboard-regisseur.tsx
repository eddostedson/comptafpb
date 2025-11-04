'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, FileCheck, AlertCircle, TrendingUp } from 'lucide-react';
import DashboardLayout from './dashboard-layout';
import { apiClient } from '@/lib/api-client';

export default function DashboardRegisseur() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    centresCount: 0,
    opPending: 0,
    alertes: 0,
    budgetConsolide: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!session?.user?.regisseurId) {
        setIsLoading(false);
        return;
      }

      try {
        const token = (session as any)?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Récupérer les centres du régisseur (l'endpoint /admin/centres retourne déjà uniquement les centres du régisseur si c'est un régisseur)
        const centresRes = await apiClient.get('/admin/centres', { headers });
        const regisseurCentres = Array.isArray(centresRes.data) ? centresRes.data : [];

        // Récupérer les budgets des centres associés (si disponible)
        let totalBudget = 0;
        try {
          const budgetsRes = await apiClient.get('/budgets', { headers });
          const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
          const regisseurBudgets = budgets.filter(
            (budget: any) => regisseurCentres.some((c: any) => c.id === budget.centreId)
          );
          totalBudget = regisseurBudgets.reduce((sum: number, budget: any) => {
            return sum + parseFloat(budget.montantTotal || 0);
          }, 0);
        } catch (error) {
          console.log('Budgets non disponibles pour le moment');
        }

        setStats({
          centresCount: regisseurCentres.length,
          opPending: 0, // Pas encore implémenté
          alertes: 0, // Pas encore implémenté
          budgetConsolide: totalBudget,
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
      title: 'Mes Centres',
      value: isLoading ? '...' : stats.centresCount.toString(),
      icon: Building2,
      description: 'Centres supervisés',
    },
    {
      title: 'OP à valider',
      value: isLoading ? '...' : stats.opPending.toString(),
      icon: FileCheck,
      description: 'En attente',
    },
    {
      title: 'Alertes',
      value: isLoading ? '...' : stats.alertes.toString(),
      icon: AlertCircle,
      description: 'Nécessitent attention',
    },
    {
      title: 'Budget consolidé',
      value: isLoading ? '...' : stats.budgetConsolide === 0 ? '0 FCFA' : `${(stats.budgetConsolide / 1000).toFixed(0)}K FCFA`,
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
          {statsData.map((stat) => {
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

