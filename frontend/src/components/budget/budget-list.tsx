'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, FileText, Calendar, Building2, CheckCircle, XCircle, Clock, Search, Filter } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

interface Budget {
  id: string;
  code: string;
  nom: string;
  annee: number;
  statut: string;
  montantTotal: number;
  createdAt: string;
  centre?: { nom: string };
}

export default function BudgetList() {
  const { data: session } = useSession();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');

  useEffect(() => {
    loadBudgets();
  }, [session]);

  const loadBudgets = async () => {
    try {
      if (!session) {
        console.error('[Budget] Pas de session utilisateur');
        return;
      }
      
      const token = (session as any)?.accessToken;
      if (!token) {
        console.error('[Budget] Pas de token JWT dans la session');
        toast.error('Session expirée. Veuillez vous reconnecter.');
        return;
      }
      
      console.log('[Budget] Chargement des budgets avec token:', token ? 'présent' : 'absent');
      const res = await apiClient.get('/budgets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[Budget] Budgets chargés:', res.data?.length || 0);
      setBudgets(res.data || []);
    } catch (error: any) {
      console.error('[Budget] Erreur chargement budgets:', error);
      console.error('[Budget] Status:', error.response?.status);
      console.error('[Budget] Data:', error.response?.data);
      
      // Ne pas rediriger si c'est juste une erreur de chargement (on reste sur la page)
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || 'Erreur lors du chargement des budgets');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatutBadge = (statut: string) => {
    const badges = {
      BROUILLON: { icon: Clock, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'BROUILLON' },
      EN_ATTENTE_VALIDATION: { icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'EN ATTENTE' },
      VALIDE: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'VALIDÉ' },
      REJETE: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'REJETÉ' },
      ARCHIVE: { icon: FileText, color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'ARCHIVÉ' },
    };
    return badges[statut as keyof typeof badges] || badges.BROUILLON;
  };

  const canCreateBudget = session?.user?.role === 'CHEF_CENTRE' || session?.user?.role === 'ADMIN';

  // Filtrer les budgets selon le terme de recherche et le statut
  const filteredBudgets = useMemo(() => {
    let filtered = budgets;

    // Filtre par terme de recherche (nom, code, année, centre)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((budget) => {
        const nomMatch = budget.nom?.toLowerCase().includes(searchLower);
        const codeMatch = budget.code?.toLowerCase().includes(searchLower);
        const anneeMatch = budget.annee?.toString().includes(searchLower);
        const centreMatch = budget.centre?.nom?.toLowerCase().includes(searchLower);
        return nomMatch || codeMatch || anneeMatch || centreMatch;
      });
    }

    // Filtre par statut
    if (filterStatut !== 'all') {
      filtered = filtered.filter((budget) => budget.statut === filterStatut);
    }

    return filtered;
  }, [budgets, searchTerm, filterStatut]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-800">Mes Budgets</h2>
        {canCreateBudget && (
          <Button onClick={() => router.push('/budget/create')} className="gap-2">
            <Plus className="w-4 h-4" />
            Nouveau Budget
          </Button>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      {budgets.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Champ de recherche */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, code, année ou centre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      // Recherche automatique en temps réel, pas besoin d'action
                    }
                  }}
                  className="pl-10 bg-white"
                />
              </div>

              {/* Filtre par statut */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <select
                  value={filterStatut}
                  onChange={(e) => setFilterStatut(e.target.value)}
                  className="pl-10 pr-8 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none cursor-pointer"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="BROUILLON">Brouillon</option>
                  <option value="EN_ATTENTE_VALIDATION">En attente</option>
                  <option value="VALIDE">Validé</option>
                  <option value="REJETE">Rejeté</option>
                  <option value="ARCHIVE">Archivé</option>
                </select>
              </div>

              {/* Bouton pour réinitialiser les filtres */}
              {(searchTerm || filterStatut !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatut('all');
                  }}
                  className="gap-2"
                >
                  Réinitialiser
                </Button>
              )}
            </div>

            {/* Compteur de résultats */}
            {(searchTerm || filterStatut !== 'all') && (
              <div className="mt-3 text-sm text-slate-600">
                Affichage de {filteredBudgets.length} budget(s) sur {budgets.length}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-4">Aucun budget créé</p>
            {canCreateBudget && (
              <Button onClick={() => router.push('/budget/create')} className="gap-2">
                <Plus className="w-4 h-4" />
                Créer votre premier budget
              </Button>
            )}
          </CardContent>
        </Card>
      ) : filteredBudgets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-600 mb-2">Aucun budget ne correspond à votre recherche</p>
            <p className="text-sm text-slate-500 mb-4">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
            {(searchTerm || filterStatut !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatut('all');
                }}
                className="gap-2"
              >
                Réinitialiser les filtres
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBudgets.map((budget) => {
            const badge = getStatutBadge(budget.statut);
            const Icon = badge.icon;
            return (
              <Card key={budget.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/budget/${budget.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.nom}</CardTitle>
                      <p className="text-sm text-slate-500 mt-1">{budget.code}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs border flex items-center gap-1 ${badge.color}`}>
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4" />
                      Année {budget.annee}
                    </div>
                    {budget.centre && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Building2 className="w-4 h-4" />
                        {budget.centre.nom}
                      </div>
                    )}
                    <div className="pt-2 border-t">
                      <span className="font-semibold text-lg">{budget.montantTotal.toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

