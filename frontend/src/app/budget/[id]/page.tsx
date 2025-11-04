'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, Edit, Printer, Save, CheckCircle, XCircle, Clock, FileText, Trash2, Plus } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import BudgetForm from '@/components/budget/budget-form';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // États pour le modal de modification des infos générales
  const [isEditInfoModalOpen, setIsEditInfoModalOpen] = useState(false);
  const [editedInfo, setEditedInfo] = useState({
    nom: '',
    annee: 2025,
    type: 'Fonctionnement',
    description: '',
  });

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

  const handleDeleteBudget = async () => {
    if (!budgetId) return;

    try {
      setIsDeleting(true);
      const token = (session as any)?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      await apiClient.delete(`/budgets/${budgetId}`, { headers });

      toast.success('Budget supprimé avec succès !');
      setIsDeleteDialogOpen(false);
      router.push('/budget');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      const errorMessage = error.response?.data?.message || 'Erreur lors de la suppression du budget';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditInfoModal = () => {
    if (budget) {
      setEditedInfo({
        nom: budget.nom || '',
        annee: budget.annee || 2025,
        type: budget.type || 'Fonctionnement',
        description: budget.description || '',
      });
      setIsEditInfoModalOpen(true);
    }
  };

  const handleSaveInfo = async () => {
    try {
      setIsSaving(true);
      const token = (session as any)?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      await apiClient.put(`/budgets/${budgetId}`, editedInfo, { headers });

      toast.success('Informations modifiées avec succès !');
      setIsEditInfoModalOpen(false);
      await loadBudget();
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
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

  const badge = getStatutBadge(budget.statut);
  const Icon = badge.icon;

  const canEdit = session?.user?.role === 'CHEF_CENTRE' && 
    (budget?.statut === 'BROUILLON' || budget?.statut === 'REJETE');
  
  const canDelete = session?.user?.role === 'ADMIN' || 
    (session?.user?.role === 'CHEF_CENTRE' && budget?.statut !== 'VALIDE');

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
                variant="outline"
                onClick={handleOpenEditInfoModal}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Modifier les informations
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2 border-red-300 text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
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

        {/* Affichage en lecture seule */}
        <BudgetDetailView budget={budget} budgetId={budgetId} onReload={loadBudget} />

        {/* Dialog de confirmation de suppression */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4 text-red-700">Supprimer le budget</h3>
              <p className="text-slate-600 mb-4">
                Êtes-vous sûr de vouloir supprimer le budget <strong>{budget?.nom}</strong> 
                {' '}(Code: <strong>{budget?.code}</strong>) ?
              </p>
              <p className="text-sm text-orange-600 mb-4">
                ⚠️ Cette action est irréversible. Toutes les sources de recettes et lignes budgétaires seront supprimées.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleDeleteBudget}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de modification des informations générales */}
        <Dialog open={isEditInfoModalOpen} onOpenChange={setIsEditInfoModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier les informations du budget</DialogTitle>
              <DialogDescription>
                Modifiez le nom, l'année, le type ou la description du budget
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nom du budget *</label>
                <Input
                  value={editedInfo.nom}
                  onChange={(e) => setEditedInfo({ ...editedInfo, nom: e.target.value })}
                  placeholder="Ex: Révision du er juillet au 31 Décembre 2025"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Année *</label>
                  <Input
                    type="number"
                    value={editedInfo.annee}
                    onChange={(e) => setEditedInfo({ ...editedInfo, annee: Number(e.target.value) })}
                    min={2020}
                    max={2100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type *</label>
                  <select
                    value={editedInfo.type}
                    onChange={(e) => setEditedInfo({ ...editedInfo, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fonctionnement">Fonctionnement</option>
                    <option value="Investissement">Investissement</option>
                    <option value="Mixte">Mixte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  value={editedInfo.description}
                  onChange={(e) => setEditedInfo({ ...editedInfo, description: e.target.value })}
                  placeholder="Description optionnelle du budget"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditInfoModalOpen(false)} disabled={isSaving}>
                Annuler
              </Button>
              <Button onClick={handleSaveInfo} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function BudgetDetailView({ budget, budgetId, onReload }: { budget: any; budgetId: string; onReload: () => void }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [editingSource, setEditingSource] = useState<any | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<any | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalRecettes = budget.sourcesRecettes?.reduce((sum: number, s: any) => sum + Number(s.montant), 0) || 0;
  const totalDepenses = budget.lignesBudgetaires?.reduce((sum: number, l: any) => sum + Number(l.montantActivite || l.montantPrevu || 0), 0) || 0;

  const canEdit = budget.statut === 'BROUILLON' || budget.statut === 'REJETE';

  const handleEditSource = (source: any) => {
    setEditingSource({ ...source });
  };

  const handleSaveSource = async () => {
    if (!editingSource) return;

    try {
      setIsUpdating(true);
      const token = (session as any)?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Récupérer toutes les sources, remplacer celle modifiée
      const updatedSources = budget.sourcesRecettes.map((s: any) =>
        s.id === editingSource.id ? { ...editingSource } : s
      );

      // Mettre à jour le budget avec les nouvelles sources
      await apiClient.put(`/budgets/${budget.id}`, {
        sourcesRecettes: updatedSources.map((s: any) => ({
          type: s.type,
          nature: s.nature || undefined,
          montant: String(s.montant)
        }))
      }, { headers });

      toast.success('Source de recette modifiée avec succès !');
      setEditingSource(null);
      router.refresh();
      window.location.reload(); // Force le rechargement des données
    } catch (error: any) {
      console.error('Erreur lors de la modification:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSource = async () => {
    if (!sourceToDelete) return;

    try {
      setIsUpdating(true);
      const token = (session as any)?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Récupérer toutes les sources sauf celle à supprimer
      const updatedSources = budget.sourcesRecettes.filter((s: any) => s.id !== sourceToDelete.id);

      console.log('[Delete Source] Sources actuelles:', budget.sourcesRecettes.length);
      console.log('[Delete Source] Sources après suppression:', updatedSources.length);
      console.log('[Delete Source] ID à supprimer:', sourceToDelete.id);

      if (updatedSources.length === 0) {
        setIsUpdating(false);
        toast.error('Vous devez conserver au moins une source de recette');
        setIsDeleteDialogOpen(false);
        setSourceToDelete(null);
        return;
      }

      // Mettre à jour le budget avec les nouvelles sources
      await apiClient.put(`/budgets/${budget.id}`, {
        sourcesRecettes: updatedSources.map((s: any) => ({
          type: s.type,
          nature: s.nature || undefined,
          montant: String(s.montant)
        }))
      }, { headers });

      toast.success('Source de recette supprimée avec succès !');
      setIsDeleteDialogOpen(false);
      setSourceToDelete(null);
      window.location.reload(); // Force le rechargement des données
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setIsUpdating(false);
    }
  };

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
              <div key={source.id || index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border group hover:bg-slate-100 transition-colors">
                <div className="flex-1">
                  <p className="font-medium text-slate-800">{source.type}</p>
                  {source.nature && <p className="text-sm text-slate-600">{source.nature}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-lg text-slate-800">
                    {Number(source.montant).toLocaleString()} FCFA
                  </p>
                  {canEdit && (
                    <div className="flex gap-1 print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSource(source)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSourceToDelete(source);
                          setIsDeleteDialogOpen(true);
                        }}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-2 border-blue-200 font-bold">
              <span className="text-blue-800">Total Recettes</span>
              <span className="text-blue-800 text-xl">{totalRecettes.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Dialog pour éditer une source */}
          {editingSource && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4">Modifier la source de recette</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Type de source</label>
                    <select
                      value={editingSource.type}
                      onChange={(e) => setEditingSource({ ...editingSource, type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BE">BE (Budget de l'État)</option>
                      <option value="RESSOURCES_PROPRES">Ressources Propres</option>
                      <option value="PTF">PTF (Partenaires Techniques et Financiers)</option>
                      <option value="DONS_LEGS">Dons / Legs</option>
                      <option value="FBP">FBP (Fonds de Bonne Performance)</option>
                      <option value="CMU">CMU (Couverture Maladie Universelle)</option>
                      <option value="SOLDE_BANCAIRE">Solde Bancaire</option>
                      <option value="REMBOURSEMENT_A_RECEVOIR">Remboursement à recevoir</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nature (optionnel)</label>
                    <input
                      type="text"
                      value={editingSource.nature || ''}
                      onChange={(e) => setEditingSource({ ...editingSource, nature: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: FBP, CMU..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant (FCFA)</label>
                    <input
                      type="number"
                      value={editingSource.montant}
                      onChange={(e) => setEditingSource({ ...editingSource, montant: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={handleSaveSource}
                    disabled={isUpdating}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditingSource(null)}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Dialog pour confirmer la suppression */}
          {isDeleteDialogOpen && sourceToDelete && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <h3 className="text-lg font-bold mb-4 text-red-700">Confirmer la suppression</h3>
                <p className="text-slate-600 mb-4">
                  Êtes-vous sûr de vouloir supprimer la source <strong>{sourceToDelete.type}</strong> 
                  {sourceToDelete.nature && ` (${sourceToDelete.nature})`} de <strong>{Number(sourceToDelete.montant).toLocaleString()} FCFA</strong> ?
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDeleteSource}
                    disabled={isUpdating}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isUpdating ? 'Suppression...' : 'Supprimer'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteDialogOpen(false);
                      setSourceToDelete(null);
                    }}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lignes budgétaires */}
      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="print:pb-2">
          <div className="flex flex-row items-center justify-between">
            <CardTitle>Lignes Budgétaires</CardTitle>
            {canEdit && (
              <Button
                onClick={() => router.push(`/budget/create?budgetId=${budgetId}&step=2&sourcesValidated=true`)}
                className="gap-2 bg-blue-600 hover:bg-blue-700 print:hidden"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Créer une dépense
              </Button>
            )}
          </div>
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
                      {Number(ligne.montantActivite || ligne.montantPrevu || 0).toLocaleString()} FCFA
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
                    {totalDepenses.toLocaleString()} FCFA
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
              <p className="text-2xl font-bold text-green-700">{totalRecettes.toLocaleString()} FCFA</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Total Dépenses</label>
              <p className="text-2xl font-bold text-red-700">{totalDepenses.toLocaleString()} FCFA</p>
            </div>
            <div className="md:col-span-2 border-t pt-4">
              <label className="text-sm font-medium text-slate-600">Solde</label>
              <p className={`text-2xl font-bold ${totalRecettes - totalDepenses >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {(totalRecettes - totalDepenses).toLocaleString()} FCFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

