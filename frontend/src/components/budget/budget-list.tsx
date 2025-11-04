'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Calendar, Building2, CheckCircle, XCircle, Clock } from 'lucide-react';
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => {
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

