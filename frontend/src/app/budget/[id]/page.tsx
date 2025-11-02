'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Printer, Save, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import BudgetForm from '@/components/budget/budget-form';
import { useEffect } from 'react';
import Link from 'next/link';

export default function BudgetDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const budgetId = params?.id as string;

  const [budget, setBudget] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (budgetId && session) {
      loadBudget();
    }
  }, [budgetId, session]);

  const loadBudget = async () => {
    try {
      const token = (session as any)?.accessToken;
      const res = await apiClient.get(`/budgets/${budgetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudget(res.data);
    } catch (error: any) {
      console.error('Erreur chargement budget:', error);
      toast.error('Erreur lors du chargement du budget');
      router.push('/budget');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const canEdit = budget?.statut === 'BROUILLON' || budget?.statut === 'EN_ATTENTE_VALIDATION' || budget?.statut === 'REJETE';

  const getStatutBadge = (statut: string) => {
    const badges = {
      BROUILLON: { icon: FileText, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Brouillon' },
      EN_ATTENTE_VALIDATION: { icon: Clock, color: 'bg-amber-100 text-amber-800 border-amber-200', label: 'En attente de validation' },
      VALIDE: { icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-200', label: 'Validé' },
      REJETE: { icon: XCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejeté' },
      ARCHIVE: { icon: FileText, color: 'bg-slate-100 text-slate-800 border-slate-200', label: 'Archivé' },
    };
    return badges[statut as keyof typeof badges] || badges.BROUILLON;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budget) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Budget introuvable</p>
            <Link href="/budget">
              <Button>Retour à la liste</Button>
            </Link>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const badge = getStatutBadge(budget.statut);
  const Icon = badge.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 print:space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/budget">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">{budget.nom}</h1>
              <p className="text-slate-600 mt-1">Code: {budget.code} • Année: {budget.annee}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={() => setIsEditing(!isEditing)}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                {isEditing ? 'Annuler' : 'Modifier'}
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimer
            </Button>
          </div>
        </div>

        {/* Badge statut */}
        <div className="print:hidden">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border gap-2 ${badge.color}`}>
            <Icon className="w-4 h-4" />
            {badge.label}
          </span>
        </div>

        {/* Formulaire en mode édition ou affichage en lecture seule */}
        {isEditing && canEdit ? (
          <BudgetForm budgetId={budgetId} onSave={loadBudget} onCancel={() => setIsEditing(false)} />
        ) : (
          <BudgetDetailView budget={budget} />
        )}
      </div>
    </DashboardLayout>
  );
}

function BudgetDetailView({ budget }: { budget: any }) {
  const totalRecettes = budget.sourcesRecettes?.reduce((sum: number, s: any) => sum + Number(s.montant), 0) || 0;
  const totalDepenses = budget.lignesBudgetaires?.reduce((sum: number, l: any) => sum + Number(l.montantActivite || l.montantPrevu || 0), 0) || 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Informations générales */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle>Informations Générales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Nom</label>
              <p className="text-slate-800">{budget.nom}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Code</label>
              <p className="text-slate-800">{budget.code}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Année</label>
              <p className="text-slate-800">{budget.annee}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Type</label>
              <p className="text-slate-800">{budget.type}</p>
            </div>
            {budget.description && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-600">Description</label>
                <p className="text-slate-800">{budget.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sources de recettes */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle>Sources de Recettes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {budget.sourcesRecettes?.map((source: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <div>
                  <p className="font-medium text-slate-800">{source.type}</p>
                  {source.nature && <p className="text-sm text-slate-600">{source.nature}</p>}
                </div>
                <p className="font-bold text-lg text-slate-800">
                  {Number(source.montant).toLocaleString()} CFA
                </p>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200 font-bold">
              <span className="text-blue-800">Total Recettes</span>
              <span className="text-blue-800 text-xl">{totalRecettes.toLocaleString()} CFA</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lignes budgétaires */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <CardTitle>Lignes Budgétaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border p-2 text-left text-sm font-medium">Activité Clé</th>
                  <th className="border p-2 text-left text-sm font-medium">Type de Moyens</th>
                  <th className="border p-2 text-center text-sm font-medium">Qté</th>
                  <th className="border p-2 text-center text-sm font-medium">Fréq.</th>
                  <th className="border p-2 text-right text-sm font-medium">Coût Unitaire</th>
                  <th className="border p-2 text-right text-sm font-medium">Montant</th>
                  <th className="border p-2 text-left text-sm font-medium">Ligne NBE</th>
                  <th className="border p-2 text-left text-sm font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {budget.lignesBudgetaires?.map((ligne: any, index: number) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="border p-2 text-sm">{ligne.activiteCle}</td>
                    <td className="border p-2 text-sm">{ligne.typeMoyens}</td>
                    <td className="border p-2 text-center text-sm">{ligne.quantite}</td>
                    <td className="border p-2 text-center text-sm">{ligne.frequence}</td>
                    <td className="border p-2 text-right text-sm">{Number(ligne.coutUnitaire).toLocaleString()}</td>
                    <td className="border p-2 text-right text-sm font-medium">
                      {Number(ligne.montantActivite || ligne.montantPrevu || 0).toLocaleString()} CFA
                    </td>
                    <td className="border p-2 text-sm">{ligne.ligneNbe || '-'}</td>
                    <td className="border p-2 text-sm">{ligne.sourceFinancement}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-bold">
                  <td colSpan={5} className="border p-2 text-right">Total Dépenses</td>
                  <td className="border p-2 text-right text-xl text-blue-800">
                    {totalDepenses.toLocaleString()} CFA
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Récapitulatif */}
      <Card className="print:border-0 print:shadow-none bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="print:pb-2">
          <CardTitle>Récapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">Total Recettes</label>
              <p className="text-2xl font-bold text-green-700">{totalRecettes.toLocaleString()} CFA</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Total Dépenses</label>
              <p className="text-2xl font-bold text-red-700">{totalDepenses.toLocaleString()} CFA</p>
            </div>
            <div className="md:col-span-2 border-t pt-4">
              <label className="text-sm font-medium text-slate-600">Solde</label>
              <p className={`text-2xl font-bold ${totalRecettes - totalDepenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {(totalRecettes - totalDepenses).toLocaleString()} CFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

