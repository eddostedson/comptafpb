'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, FileText, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

type SourceRecette = {
  type: string;
  nature?: string;
  montant: string;
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  BE: 'BE (Budget de l\'État)',
  RESSOURCES_PROPRES: 'Ressources Propres',
  PTF: 'PTF (Partenaires Techniques et Financiers)',
  DONS_LEGS: 'Dons / Legs',
  FBP: 'FBP (Fonds de Bonne Performance)',
  CMU: 'CMU (Couverture Maladie Universelle)',
  SOLDE_BANCAIRE: 'Solde Bancaire',
  REMBOURSEMENT_A_RECEVOIR: 'Remboursement à recevoir',
};

export default function PreviewRecettesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [sources, setSources] = useState<SourceRecette[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const budgetId = searchParams.get('budgetId');

  useEffect(() => {
    const loadBudgetSources = async () => {
      if (!budgetId || budgetId === 'new') {
        // Fallback : essayer de charger depuis les paramètres d'URL (pour rétrocompatibilité)
        const sourcesParam = searchParams.get('sources');
        if (sourcesParam) {
          try {
            const parsedSources = JSON.parse(decodeURIComponent(sourcesParam));
            setSources(parsedSources);
            setIsLoading(false);
            return;
          } catch (error) {
            console.error('Erreur lors du parsing des sources:', error);
          }
        }
        toast.error('Budget introuvable. Veuillez recommencer.');
        router.push('/budget/create');
        return;
      }

      try {
        setIsLoading(true);
        const token = (session as any)?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        // Charger le budget depuis l'API
        const res = await apiClient.get(`/budgets/${budgetId}`, { headers });
        const budgetData = res.data;
        
        // Convertir les sources de recettes depuis la base de données
        if (budgetData.sourcesRecettes && budgetData.sourcesRecettes.length > 0) {
          const convertedSources: SourceRecette[] = budgetData.sourcesRecettes.map((s: any) => ({
            type: s.type,
            nature: s.nature || '',
            montant: String(s.montant || '0'),
          }));
          setSources(convertedSources);
        } else {
          toast.error('Aucune source de recette trouvée dans ce budget.');
          router.push(`/budget/${budgetId}`);
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des recettes:', error);
        toast.error(error.response?.data?.message || 'Erreur lors du chargement des recettes');
        router.push(budgetId ? `/budget/${budgetId}` : '/budget/create');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      loadBudgetSources();
    }
  }, [budgetId, searchParams, session, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const total = sources.reduce((sum, s) => sum + Number(s.montant || 0), 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
          <div className="max-w-6xl mx-auto text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-4">Chargement des recettes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-800">Tableau de Prévision des Recettes</h1>
                <p className="text-sm text-slate-600 mt-1">État de synthèse des recettes validées</p>
              </div>
            </div>
          </div>

          {/* Tableau des recettes */}
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600">
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <FileText className="w-5 h-5" />
                RECETTES
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-green-50">
                  <TableRow>
                    <TableHead className="w-[60px] text-center font-semibold">N°</TableHead>
                    <TableHead className="font-semibold">Source de Financement</TableHead>
                    <TableHead className="font-semibold">Nature (Optionnel)</TableHead>
                    <TableHead className="text-right font-semibold">Montant (FCFA)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source, index) => (
                    <TableRow key={index} className="hover:bg-slate-50">
                      <TableCell className="text-center font-medium text-slate-600">
                        {index + 1}
                      </TableCell>
                      <TableCell className="font-medium">
                        {SOURCE_TYPE_LABELS[source.type] || source.type}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {source.nature || '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(source.montant || 0))} FCFA
                      </TableCell>
                    </TableRow>
                  ))}
                  {sources.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                        Aucune source de financement trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Total */}
              {sources.length > 0 && (
                <div className="border-t-2 border-green-300 bg-green-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-bold text-green-800">Total des recettes prévues</p>
                    <p className="text-2xl font-bold text-green-700">
                      {formatCurrency(total)} FCFA
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Retourner au formulaire du budget
                  if (budgetId && budgetId !== 'new') {
                    router.push(`/budget/${budgetId}?step=1&sourcesValidated=true`);
                  } else {
                    router.push('/budget/create');
                  }
                }}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Modifier
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Aller à la page de détail du budget
                  if (budgetId && budgetId !== 'new') {
                    router.push(`/budget/${budgetId}`);
                  } else {
                    toast.error('Budget introuvable.');
                  }
                }}
                className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                <Eye className="w-4 h-4" />
                Voir le budget complet
              </Button>
            </div>
            <Button
              onClick={() => {
                // Aller à l'étape 2 avec le budget sauvegardé
                if (budgetId && budgetId !== 'new') {
                  router.push(`/budget/${budgetId}?step=2&sourcesValidated=true`);
                } else {
                  toast.error('Budget introuvable. Veuillez recommencer.');
                  router.push('/budget/create');
                }
              }}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              Continuer vers les dépenses
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

