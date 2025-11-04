'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, FileText, CheckCircle, Clock, Plus, Building2, Users } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from './dashboard-layout';
import { apiClient } from '@/lib/api-client';

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  centreId?: string;
  regisseurId?: string;
  centre?: {
    id: string;
    code: string;
    nom: string;
    niveau?: string;
    type?: string;
    commune?: string;
    region?: string;
  };
  regisseur?: {
    id: string;
    code: string;
    nom: string;
    prenom: string;
    region?: string;
  };
}

export default function DashboardChef() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    soldeDisponible: 0,
    opCrees: 0,
    opValides: 0,
    opEnAttente: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Charger le profil complet avec centre et régisseur
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user) {
        return;
      }

      try {
        setIsLoadingProfile(true);
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/auth/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProfile(response.data);
      } catch (error) {
        console.error('Erreur lors du chargement du profil:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (session) {
      loadProfile();
    }
  }, [session]);

  useEffect(() => {
    const loadStats = async () => {
      if (!session?.user?.centreId) {
        setIsLoading(false);
        return;
      }

      try {
        const token = (session as any)?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Récupérer les budgets du centre
        let solde = 0;
        try {
          const budgetsRes = await apiClient.get('/budgets', { headers });
          const budgets = Array.isArray(budgetsRes.data) ? budgetsRes.data : [];
          
          // Calculer le solde disponible (montantTotal - montantDepense)
          solde = budgets.reduce((sum: number, budget: any) => {
            const total = parseFloat(budget.montantTotal || 0);
            const depense = parseFloat(budget.montantDepense || 0);
            return sum + (total - depense);
          }, 0);
        } catch (error) {
          console.log('Budgets non disponibles pour le moment');
        }

        // Les OP ne sont pas encore implémentés, donc 0
        setStats({
          soldeDisponible: solde,
          opCrees: 0,
          opValides: 0,
          opEnAttente: 0,
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

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M FCFA`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K FCFA`;
    } else {
      return `${amount.toLocaleString('fr-FR')} FCFA`;
    }
  };

  const statsData = [
    {
      title: 'Solde disponible',
      value: isLoading ? '...' : formatCurrency(stats.soldeDisponible),
      icon: Wallet,
      description: 'Budget restant',
    },
    {
      title: 'OP créés',
      value: isLoading ? '...' : stats.opCrees.toString(),
      icon: FileText,
      description: 'Ce mois',
    },
    {
      title: 'OP validés',
      value: isLoading ? '...' : stats.opValides.toString(),
      icon: CheckCircle,
      description: 'Par le régisseur',
    },
    {
      title: 'OP en attente',
      value: isLoading ? '...' : stats.opEnAttente.toString(),
      icon: Clock,
      description: 'En cours de validation',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">
              Bienvenue, {session?.user.name || 'Chef de Centre'}
            </h1>
            <p className="text-muted-foreground">Gestion de votre centre</p>
          </div>

          {/* Informations du centre et du régisseur */}
          {profile && (profile.centre || profile.regisseur) && (
            <div className="grid md:grid-cols-2 gap-4">
              {profile.centre && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">
                          Votre Centre de Santé
                        </p>
                        <p className="text-sm font-bold text-blue-800">
                          {profile.centre.niveau ? `${profile.centre.niveau} ` : ''}{profile.centre.nom}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Code: <span className="font-medium">{profile.centre.code}</span>
                          {profile.centre.commune && (
                            <> • {profile.centre.commune}</>
                          )}
                          {profile.centre.region && (
                            <> • {profile.centre.region}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {profile.regisseur && (
                <Card className="border-2 border-green-200 bg-green-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-green-900 uppercase tracking-wide mb-1">
                          Votre Régisseur
                        </p>
                        <p className="text-sm font-bold text-green-800">
                          {profile.regisseur.prenom} {profile.regisseur.nom}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Code: <span className="font-medium">{profile.regisseur.code}</span>
                          {profile.regisseur.region && (
                            <> • Région: {profile.regisseur.region}</>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
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
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/budget/create"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Créer un Plan d'Action Annuel (PAA)
              </Link>
              <Link
                href="/budget"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                <Wallet className="w-5 h-5" />
                Voir mes budgets
              </Link>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Créez et gérez les budgets annuels (PAA) pour votre centre de santé.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

