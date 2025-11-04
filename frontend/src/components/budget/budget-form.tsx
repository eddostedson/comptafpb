'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Save, Send, CheckCircle, XCircle, Building2, Users } from 'lucide-react';
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
  id?: string; // ID de la ligne budgétaire en base de données
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

interface UserProfile {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone?: string;
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

export default function BudgetForm({ budgetId: initialBudgetId, onSave, onCancel }: BudgetFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [budgetId, setBudgetId] = useState<string | undefined>(initialBudgetId);
  const [isLoadingBudget, setIsLoadingBudget] = useState(!!initialBudgetId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // Étape 0 : Informations générales
  const [nom, setNom] = useState('');
  const [description, setDescription] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [type, setType] = useState<TypeBudget>(TypeBudget.FONCTIONNEMENT);

  // Étape 1 : Sources de recettes (commencer avec une liste vide, l'utilisateur ajoutera les sources)
  const [sourcesRecettes, setSourcesRecettes] = useState<SourceRecette[]>([]);
  const [sourcesValidated, setSourcesValidated] = useState(false);

  // Étape 2 : Dépenses détaillées
  const [lignesBudgetaires, setLignesBudgetaires] = useState<LigneBudgetaire[]>([]);

  // Charger le profil complet avec centre et régisseur pour les chefs de centre
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user || session.user.role !== 'CHEF_CENTRE') {
        return;
      }

      try {
        setIsLoadingProfile(true);
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/auth/profile', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setProfile(response.data);
      } catch (error: any) {
        console.error('Erreur lors du chargement du profil:', error);
        // Ne pas bloquer l'application si le profil ne peut pas être chargé
        // L'utilisateur peut quand même utiliser le formulaire
        if (error.response?.status === 500) {
          console.warn('Erreur serveur lors du chargement du profil, continuation sans profil');
        }
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (session) {
      loadProfile();
    }
  }, [session]);

  // Charger le budget si on est en mode édition
  useEffect(() => {
    if (budgetId && budgetId !== 'new' && session) {
      console.log('Chargement du budget avec ID:', budgetId);
      setIsLoadingBudget(true);
      loadBudgetForEdit();
    }
  }, [budgetId, session]);

  const loadBudgetForEdit = async () => {
    try {
      console.log('loadBudgetForEdit - Chargement du budget', budgetId);
      const token = (session as any)?.accessToken;
      const res = await apiClient.get(`/budgets/${budgetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const budgetData = res.data;
      console.log('Budget chargé:', budgetData);
      
      setNom(budgetData.nom || '');
      setDescription(budgetData.description || '');
      setAnnee(budgetData.annee || new Date().getFullYear());
      setType(budgetData.type || TypeBudget.FONCTIONNEMENT);
      
      // Convertir les sources de recettes
      if (budgetData.sourcesRecettes && budgetData.sourcesRecettes.length > 0) {
        console.log('Chargement de', budgetData.sourcesRecettes.length, 'sources de recettes');
        setSourcesRecettes(
          budgetData.sourcesRecettes.map((s: any) => ({
            type: s.type,
            nature: s.nature || '',
            montant: String(s.montant || '0'),
          }))
        );
        // Si le budget a des sources de recettes, elles sont validées
        setSourcesValidated(true);
      }
      
      // Convertir les lignes budgétaires
      if (budgetData.lignesBudgetaires && budgetData.lignesBudgetaires.length > 0) {
        console.log('Chargement de', budgetData.lignesBudgetaires.length, 'lignes budgétaires');
        setLignesBudgetaires(
          budgetData.lignesBudgetaires.map((l: any) => ({
            id: l.id, // Inclure l'ID pour la persistance
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
      } else {
        console.log('Aucune ligne budgétaire trouvée');
      }
    } catch (error: any) {
      console.error('Erreur chargement budget pour édition:', error);
      if (error.response?.status === 500) {
        toast.error('Erreur serveur lors du chargement du budget. Veuillez réessayer.');
      } else if (error.response?.status === 404) {
        toast.error('Budget introuvable.');
      } else {
        toast.error('Erreur lors du chargement du budget');
      }
    } finally {
      setIsLoadingBudget(false);
    }
  };

  const handleValidateSources = async (validatedSources: SourceRecette[]) => {
    // Valider que le nom du budget est renseigné
    if (!nom.trim()) {
      toast.error('Le nom du budget est requis avant de valider les recettes');
      return;
    }

    setLoading(true);
    try {
      const token = (session as any)?.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Préparer les données pour sauvegarder
      // Nettoyer les montants : s'assurer qu'ils sont des strings non vides et valides
      const cleanedSources = validatedSources.map((source) => ({
        ...source,
        montant: source.montant.trim() || '0',
      }));

      const budgetData = {
        nom,
        description: description || undefined,
        annee,
        type,
        sourcesRecettes: cleanedSources,
        lignesBudgetaires: [], // Pas encore de lignes budgétaires à ce stade
      };

      let savedBudgetId = budgetId;

      if (budgetId) {
        // Mode édition : mettre à jour le budget avec les sources validées
        await apiClient.put(`/budgets/${budgetId}`, budgetData, { headers });
        savedBudgetId = budgetId;
      } else {
        // Mode création : créer le budget avec les sources validées
        const res = await apiClient.post('/budgets', budgetData, { headers });
        savedBudgetId = res.data.id;
        setBudgetId(savedBudgetId); // Mettre à jour le state local avec le budgetId créé
      }

      // Mettre à jour l'état local
      setSourcesRecettes(validatedSources);
      setSourcesValidated(true);
      
      // Naviguer vers la page de consultation des recettes validées avec l'ID du budget sauvegardé
      router.push(`/budget/preview-recettes?budgetId=${savedBudgetId}`);
      
      toast.success('Recettes validées et sauvegardées ! ✨', {
        description: 'Vous pouvez maintenant passer aux dépenses.',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des recettes:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde des recettes');
    } finally {
      setLoading(false);
    }
  };

  // Restaurer l'état depuis les query params au retour de la page de preview
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const stepParam = searchParams.get('step');
    const sourcesValidatedParam = searchParams.get('sourcesValidated');
    
    if (stepParam) {
      const step = parseInt(stepParam, 10);
      if (step >= 1 && step <= 3) {
        console.log('Restauration de l\'étape depuis URL:', step);
        setCurrentStep(step);
      }
    }

    if (sourcesValidatedParam === 'true') {
      console.log('Sources marquées comme validées depuis URL');
      setSourcesValidated(true);
    }
  }, []);

  const autoSaveExpenses = async () => {
    if (!nom.trim()) {
      console.log('Sauvegarde automatique ignorée : nom du budget manquant');
      return;
    }

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
        // Budget existant : mise à jour
        await apiClient.put(`/budgets/${budgetId}`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Pas encore de budget : création automatique
        const res = await apiClient.post('/budgets', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const createdBudgetId = res.data.id;
        setBudgetId(createdBudgetId);
        // Mettre à jour l'URL pour inclure le budgetId
        window.history.replaceState({}, '', `/budget/create?budgetId=${createdBudgetId}&step=2&sourcesValidated=true`);
        console.log('Budget créé automatiquement avec ID:', createdBudgetId);
      }
      
      // Toast discret pour indiquer la sauvegarde
      toast.success('💾 Sauvegarde automatique effectuée', {
        duration: 2000,
      });
    } catch (error: any) {
      console.error('Erreur sauvegarde automatique:', error);
      toast.error('Erreur lors de la sauvegarde automatique');
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // Vérifier que les sources sont validées
      if (!sourcesValidated) {
        toast.error('Veuillez d\'abord valider les sources de recettes');
        return;
      }
    }
    if (currentStep === 2) {
      // Validation étape 2 : au moins une ligne budgétaire
      if (lignesBudgetaires.length === 0) {
        toast.error('Veuillez ajouter au moins une ligne budgétaire');
        return;
      }
      
      // Sauvegarder les dépenses avant de passer à l'étape 3
      await saveDependenciesBeforeNext();
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const saveDependenciesBeforeNext = async () => {
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
        toast.success('Dépenses sauvegardées ! ✅');
      } else {
        // Mode création : POST (créer ou mettre à jour)
        const res = await apiClient.post('/budgets', data, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Stocker l'ID du budget créé pour les prochaines sauvegardes
        const createdBudgetId = res.data.id;
        setBudgetId(createdBudgetId);
        // Mettre à jour l'URL pour inclure le budgetId
        window.history.replaceState({}, '', `/budget/create?budgetId=${createdBudgetId}&step=2&sourcesValidated=true`);
        toast.success('Dépenses sauvegardées ! ✅');
      }
    } catch (error: any) {
      console.error('Erreur sauvegarde dépenses:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde des dépenses');
      throw error;
    } finally {
      setLoading(false);
    }
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle>
              {budgetId ? 'Modification du Plan d\'Action Annuel (PAA)' : 'Création du Plan d\'Action Annuel (PAA)'}
            </CardTitle>
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded text-xs ${currentStep === 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>1. Sources</span>
              <span className={`px-2 py-1 rounded text-xs ${currentStep === 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>2. Dépenses</span>
              <span className={`px-2 py-1 rounded text-xs ${currentStep === 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>3. Récapitulatif</span>
            </div>
          </div>
          
          {/* Informations du centre et du régisseur pour les chefs de centre */}
          {session?.user?.role === 'CHEF_CENTRE' && profile && (
            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              {profile.centre && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-1">
                      Centre de Santé
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

                    {/* Sources de financement */}
                    {sourcesRecettes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs font-medium text-blue-900 uppercase tracking-wide mb-2">
                          Sources de Financement
                        </p>
                        <div className="space-y-1">
                          {sourcesRecettes.map((source, idx) => {
                            const sourceLabels: Record<string, string> = {
                              'BE': 'BE',
                              'RESSOURCES_PROPRES': 'Ressources Propres',
                              'PTF': 'PTF',
                              'DONS_LEGS': 'Dons/Legs',
                              'FBP': 'FBP',
                              'CMU': 'CMU',
                              'SOLDE_BANCAIRE': 'Solde Bancaire',
                              'REMBOURSEMENT_A_RECEVOIR': 'Remboursement à recevoir',
                            };
                            return (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-blue-700">
                                  {sourceLabels[source.type] || source.type} {source.nature && `(${source.nature})`}
                                </span>
                                <span className="font-medium text-blue-800">
                                  {Number(source.montant || 0).toLocaleString('fr-FR')} FCFA
                                </span>
                              </div>
                            );
                          })}
                          <div className="flex justify-between items-center text-xs font-bold pt-2 mt-2 border-t border-blue-300">
                            <span className="text-blue-900">Total des recettes</span>
                            <span className="text-blue-900">
                              {sourcesRecettes.reduce((sum, s) => sum + Number(s.montant || 0), 0).toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {profile.regisseur && (
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-green-900 uppercase tracking-wide mb-1">
                      Régisseur (validation)
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
                    {currentStep === 3 && (
                      <p className="text-xs text-green-700 mt-2 font-medium">
                        ✓ Ce PAA sera soumis à {profile.regisseur.prenom} {profile.regisseur.nom} pour validation
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {session?.user?.role === 'CHEF_CENTRE' && !profile?.regisseur && !isLoadingProfile && (
            <div className="pt-4 border-t">
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ Aucun régisseur n'est assigné à votre centre. Le PAA ne pourra pas être soumis pour validation. Veuillez contacter l'administrateur.
                </p>
              </div>
            </div>
          )}
        </div>
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
            onValidate={handleValidateSources}
            isValidated={sourcesValidated}
          />
        )}

        {/* Étape 2 : Dépenses détaillées */}
        {currentStep === 2 && (
          <BudgetStep2Expenses
            lignes={lignesBudgetaires}
            onChange={setLignesBudgetaires}
            onAutoSave={autoSaveExpenses}
            sourcesRecettes={sourcesValidated ? sourcesRecettes : []}
            budgetId={budgetId}
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
            centre={profile?.centre}
            regisseur={profile?.regisseur}
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

