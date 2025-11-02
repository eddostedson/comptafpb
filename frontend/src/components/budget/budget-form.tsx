'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, CheckCircle, XCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import BudgetStep1Sources from './budget-step1-sources';
import BudgetStep2Expenses from './budget-step2-expenses';
import BudgetStep3Summary from './budget-step3-summary';

// Enum TypeBudget (définition locale pour éviter l'import @prisma/client côté frontend)
enum TypeBudget {
  FONCTIONNEMENT = 'FONCTIONNEMENT',
  INVESTISSEMENT = 'INVESTISSEMENT',
  RESSOURCES_HUMAINES = 'RESSOURCES_HUMAINES',
  EQUIPEMENT = 'EQUIPEMENT',
  MAINTENANCE = 'MAINTENANCE',
  FORMATION = 'FORMATION',
}

type SourceRecette = {
  type: 'BE' | 'RESSOURCES_PROPRES' | 'PTF' | 'DONS_LEGS' | 'FBP' | 'CMU' | 'SOLDE_BANCAIRE';
  nature?: string;
  montant: string;
};

type LigneBudgetaire = {
  activiteCle: string;
  typeMoyens: string;
  quantite: string;
  frequence: string;
  coutUnitaire: string;
  ligneNbe?: string;
  libelleNbe?: string;
  sourceFinancement: 'FBP' | 'CMU' | 'RP' | 'BE' | 'AUTRES';
};

interface BudgetFormProps {
  budgetId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function BudgetForm({ budgetId, onSave, onCancel }: BudgetFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isLoadingBudget, setIsLoadingBudget] = useState(!!budgetId);

  // Étape 0 : Informations générales
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [type, setType] = useState<TypeBudget>(TypeBudget.FONCTIONNEMENT);

  // Étape 1 : Sources de recettes
  const [sourcesRecettes, setSourcesRecettes] = useState<SourceRecette[]>([
    { type: 'BE', montant: '0' },
    { type: 'RESSOURCES_PROPRES', montant: '0' },
    { type: 'PTF', montant: '0' },
    { type: 'DONS_LEGS', montant: '0' },
  ]);

  // Étape 2 : Dépenses détaillées
  const [lignesBudgetaires, setLignesBudgetaires] = useState<LigneBudgetaire[]>([]);

  // Charger le budget si on est en mode édition
  useEffect(() => {
    if (budgetId && session) {
      loadBudgetForEdit();
    }
  }, [budgetId, session]);

  const loadBudgetForEdit = async () => {
    try {
      const token = (session as any)?.accessToken;
      const res = await apiClient.get(`/budgets/${budgetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetData = res.data;
      
      setNom(budgetData.nom || '');
      setDescription(budgetData.description || '');
      setAnnee(budgetData.annee || new Date().getFullYear());
      setType(budgetData.type || TypeBudget.FONCTIONNEMENT);
      
      // Convertir les sources de recettes
      if (budgetData.sourcesRecettes && budgetData.sourcesRecettes.length > 0) {
        setSourcesRecettes(
          budgetData.sourcesRecettes.map((s: any) => ({
            type: s.type,
            nature: s.nature || '',
            montant: String(s.montant || '0'),
          }))
        );
      }
      
      // Convertir les lignes budgétaires
      if (budgetData.lignesBudgetaires && budgetData.lignesBudgetaires.length > 0) {
        setLignesBudgetaires(
          budgetData.lignesBudgetaires.map((l: any) => ({
            activiteCle: l.activiteCle || '',
            typeMoyens: l.typeMoyens || '',
            quantite: String(l.quantite || '0'),
            frequence: String(l.frequence || '0'),
            coutUnitaire: String(l.coutUnitaire || '0'),
            ligneNbe: l.ligneNbe || '',
            libelleNbe: l.libelleNbe || '',
            sourceFinancement: l.sourceFinancement || 'FBP',
          }))
        );
      }
    } catch (error: any) {
      console.error('Erreur chargement budget pour édition:', error);
      toast.error('Erreur lors du chargement du budget');
    } finally {
      setIsLoadingBudget(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      // Validation étape 1 : au moins une source avec montant > 0
      const hasValidSource = sourcesRecettes.some((s) => Number(s.montant) > 0);
      if (!hasValidSource) {
        toast.error('Veuillez renseigner au moins une source de recette');
        return;
      }
    }
    if (currentStep === 2) {
      // Validation étape 2 : au moins une ligne budgétaire
      if (lignesBudgetaires.length === 0) {
        toast.error('Veuillez ajouter au moins une ligne budgétaire');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      toast.error('Le nom du budget est requis');
      return;
    }

    setLoading(true);
    try {
      const token = await (session as any)?.accessToken;
      const data = {
        nom,
        description,
        annee,
        type,
        sourcesRecettes,
        lignesBudgetaires,
      };

      if (budgetId) {
        // Mode édition : PUT
        await apiClient.put(`/budgets/${budgetId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Budget modifié avec succès ! ✨', {
          description: `Le budget "${nom}" a été mis à jour.`,
          duration: 3000,
        });
        if (onSave) {
          onSave();
        } else {
          router.push(`/budget/${budgetId}`);
        }
      } else {
        // Mode création : POST
        const res = await apiClient.post('/budgets', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Budget créé avec succès ! ✨', {
          description: `Le budget "${nom}" a été créé.`,
          duration: 3000,
        });
        router.push(`/budget/${res.data.id}`);
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde budget:', error);
      toast.error(error.response?.data?.message || `Erreur lors de la ${budgetId ? 'modification' : 'création'} du budget`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingBudget) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Chargement du budget...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{budgetId ? 'Modification du Budget' : 'Création du Budget'}</span>
          <div className="flex gap-2">
            <span className={`px-2 py-1 rounded text-xs ${currentStep === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>1. Sources</span>
            <span className={`px-2 py-1 rounded text-xs ${currentStep === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>2. Dépenses</span>
            <span className={`px-2 py-1 rounded text-xs ${currentStep === 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>3. Récapitulatif</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Étape 0 : Informations générales (affiché uniquement à l'étape 1) */}
        {currentStep === 1 && (
          <div className="space-y-4 border-b pb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nom du budget *</label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Budget 2024 - Centre de Santé"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Année *</label>
                <input
                  type="number"
                  value={annee}
                  onChange={(e) => setAnnee(Number(e.target.value))}
                  min={2020}
                  max={2100}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TypeBudget)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TypeBudget.FONCTIONNEMENT}>Fonctionnement</option>
                  <option value={TypeBudget.INVESTISSEMENT}>Investissement</option>
                  <option value={TypeBudget.RESSOURCES_HUMAINES}>Ressources Humaines</option>
                  <option value={TypeBudget.EQUIPEMENT}>Équipement</option>
                  <option value={TypeBudget.MAINTENANCE}>Maintenance</option>
                  <option value={TypeBudget.FORMATION}>Formation</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description optionnelle du budget"
                rows={3}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Étape 1 : Sources de recettes */}
        {currentStep === 1 && (
          <BudgetStep1Sources
            sources={sourcesRecettes}
            onChange={setSourcesRecettes}
          />
        )}

        {/* Étape 2 : Dépenses détaillées */}
        {currentStep === 2 && (
          <BudgetStep2Expenses
            lignes={lignesBudgetaires}
            onChange={setLignesBudgetaires}
          />
        )}

        {/* Étape 3 : Récapitulatif */}
        {currentStep === 3 && (
          <BudgetStep3Summary
            sources={sourcesRecettes}
            lignes={lignesBudgetaires}
            nom={nom}
            description={description}
            annee={annee}
            type={type}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                Annuler
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={currentStep === 1 || loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Précédent
            </Button>
          </div>
          <div className="flex gap-2">
            {currentStep < 3 ? (
              <Button onClick={handleNext} disabled={loading}>
                Suivant
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={loading} className="gap-2">
                <Save className="w-4 h-4" />
                {loading ? (budgetId ? 'Modification...' : 'Création...') : (budgetId ? 'Enregistrer les modifications' : 'Créer le budget')}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

