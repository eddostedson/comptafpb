'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Trash2, Search, CheckCircle, Edit, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

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

interface Props {
  lignes: LigneBudgetaire[];
  onChange: (lignes: LigneBudgetaire[]) => void;
  onAutoSave?: () => Promise<void>;
  sourcesRecettes?: Array<{
    type: string;
    nature?: string;
    montant: string;
  }>;
  budgetId?: string; // ID du budget pour la persistance immédiate
}

const SOURCE_FINANCEMENTS = [
  { value: 'FBP', label: 'FBP' },
  { value: 'CMU', label: 'CMU' },
  { value: 'RP', label: 'RP' },
  { value: 'BE', label: 'BE' },
  { value: 'AUTRES', label: 'Autres' },
] as const;

export default function BudgetStep2Expenses({ lignes, onChange, onAutoSave, sourcesRecettes = [], budgetId }: Props) {
  const { data: session } = useSession();
  const [isSaving, setIsSaving] = useState(false);
  const [nbeLines, setNbeLines] = useState<any[]>([]);
  const [searchNbe, setSearchNbe] = useState<string>('');
  const [showNbeDropdown, setShowNbeDropdown] = useState<boolean>(false);
  const [lastNbeUpdate, setLastNbeUpdate] = useState<string>('');
  
  // État pour la recherche de type de moyens
  const [searchTypeMoyens, setSearchTypeMoyens] = useState<string>('');
  
  // État pour le filtre par source de financement
  const [filterSourceFinancement, setFilterSourceFinancement] = useState<string>('');

  // États pour l'autocomplétion des activités clés et types de moyens
  const [activiteCleSuggestions, setActiviteCleSuggestions] = useState<string[]>([]);
  const [showActiviteCleDropdown, setShowActiviteCleDropdown] = useState<boolean>(false);
  const [typeMoyensSuggestions, setTypeMoyensSuggestions] = useState<string[]>([]);
  const [showTypeMoyensDropdown, setShowTypeMoyensDropdown] = useState<boolean>(false);
  
  // État pour afficher/masquer le tableau récapitulatif
  const [showRecapitulatif, setShowRecapitulatif] = useState<boolean>(false);
  
  // États pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [currentForm, setCurrentForm] = useState<LigneBudgetaire>({
    activiteCle: '',
    typeMoyens: '',
    quantite: '1',
    frequence: '1',
    coutUnitaire: '0',
    sourceFinancement: 'FBP',
  });

  // Refs pour les champs du formulaire
  const quantiteInputRef = useRef<HTMLInputElement>(null);
  const lastRowRef = useRef<HTMLTableRowElement>(null);
  const lastAddedIdRef = useRef<string | null>(null);

  // Charger les suggestions d'activités clés
  const loadActiviteCleSuggestions = useCallback(async (query?: string) => {
    try {
      const token = (session as any)?.accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = query ? { q: query } : {};
      const res = await apiClient.get('/budgets/suggestions/activites-cles', { params, headers });
      setActiviteCleSuggestions(res.data || []);
    } catch (error: any) {
      console.error('[Suggestions] Erreur chargement activités clés:', error);
      // Ne pas afficher d'erreur toast pour les suggestions (silencieux)
    }
  }, [session]);

  // Charger les suggestions de types de moyens
  const loadTypeMoyensSuggestions = useCallback(async (query?: string) => {
    try {
      const token = (session as any)?.accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const params = query ? { q: query } : {};
      const res = await apiClient.get('/budgets/suggestions/types-moyens', { params, headers });
      setTypeMoyensSuggestions(res.data || []);
    } catch (error: any) {
      console.error('[Suggestions] Erreur chargement types de moyens:', error);
      // Ne pas afficher d'erreur toast pour les suggestions (silencieux)
    }
  }, [session]);

  useEffect(() => {
    loadNbeLines();
  }, []);

  // Debounce pour les suggestions d'activités clés
  useEffect(() => {
    if (currentForm.activiteCle.length >= 2) {
      const timeoutId = setTimeout(() => {
        loadActiviteCleSuggestions(currentForm.activiteCle);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setActiviteCleSuggestions([]);
      setShowActiviteCleDropdown(false);
    }
  }, [currentForm.activiteCle, loadActiviteCleSuggestions]);

  // Debounce pour les suggestions de types de moyens
  useEffect(() => {
    if (currentForm.typeMoyens.length >= 2) {
      const timeoutId = setTimeout(() => {
        loadTypeMoyensSuggestions(currentForm.typeMoyens);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setTypeMoyensSuggestions([]);
      setShowTypeMoyensDropdown(false);
    }
  }, [currentForm.typeMoyens, loadTypeMoyensSuggestions]);

  // Effet pour faire défiler vers la dernière ligne ajoutée quand elle apparaît
  useEffect(() => {
    if (lastAddedIdRef.current && lastRowRef.current) {
      // Délai pour laisser le DOM se mettre à jour
      setTimeout(() => {
        if (lastRowRef.current) {
          lastRowRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Mettre en surbrillance la ligne ajoutée
          lastRowRef.current.classList.add('bg-green-50');
          lastRowRef.current.style.borderLeft = '4px solid #10b981';
          setTimeout(() => {
            lastRowRef.current?.classList.remove('bg-green-50');
            if (lastRowRef.current) {
              lastRowRef.current.style.borderLeft = '';
            }
            // Réinitialiser la référence après la surbrillance
            lastAddedIdRef.current = null;
          }, 2000);
        }
      }, 100);
    }
  }, [lignes.length]);

  // Correspondance automatique NBE pour le formulaire modal
  useEffect(() => {
    if (nbeLines.length === 0) return;
    
    const codeNbe = currentForm.ligneNbe?.trim() || '';
    
    if (codeNbe && codeNbe !== lastNbeUpdate && codeNbe.length >= 3) {
      const matchingNbe = nbeLines.find(
        (n) => !n.isHeader && n.ligne && n.ligne.trim() === codeNbe
      );
      
      if (matchingNbe) {
        setCurrentForm(prev => ({ ...prev, libelleNbe: matchingNbe.libelle || '' }));
        setLastNbeUpdate(codeNbe);
      } else if (currentForm.libelleNbe) {
        setCurrentForm(prev => ({ ...prev, libelleNbe: '' }));
        setLastNbeUpdate(codeNbe);
      }
    } else if (!codeNbe && lastNbeUpdate) {
      setCurrentForm(prev => ({ ...prev, libelleNbe: '' }));
      setLastNbeUpdate('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentForm.ligneNbe, nbeLines.length]);

  const loadNbeLines = async () => {
    try {
      console.log('[NBE] Chargement des lignes NBE...');
      const res = await apiClient.get('/nbe', { params: { pageSize: 1000, sort: 'ligne', dir: 'asc' } });
      console.log('[NBE] Réponse API:', res.data);
      const items = res.data?.items || [];
      console.log('[NBE] Nombre de lignes chargées:', items.length);
      // Filtrer les en-têtes
      const filteredItems = items.filter((item: any) => !item.isHeader);
      console.log('[NBE] Nombre de lignes après filtrage (sans en-têtes):', filteredItems.length);
      setNbeLines(filteredItems);
    } catch (error: any) {
      console.error('[NBE] Erreur chargement NBE:', error);
      console.error('[NBE] Détails:', error.response?.data || error.message);
      toast.error('Erreur lors du chargement des lignes NBE');
    }
  };

  const handleOpenModal = (index?: number) => {
    if (index !== undefined) {
      // Mode édition
      setEditIndex(index);
      setCurrentForm({ ...lignes[index] });
    } else {
      // Mode ajout : copier les informations de la dernière dépense
      setEditIndex(null);
      const lastLigne = lignes.length > 0 ? lignes[lignes.length - 1] : null;
      
      if (lastLigne) {
        setCurrentForm({
          activiteCle: lastLigne.activiteCle,
          typeMoyens: lastLigne.typeMoyens,
          ligneNbe: lastLigne.ligneNbe,
          libelleNbe: lastLigne.libelleNbe,
          sourceFinancement: lastLigne.sourceFinancement,
          quantite: '1',
          frequence: '1',
          coutUnitaire: '0', // Réinitialisé à 0
        });
      } else {
        setCurrentForm({
          activiteCle: '',
          typeMoyens: '',
          quantite: '1',
          frequence: '1',
          coutUnitaire: '0',
          sourceFinancement: 'FBP',
        });
      }
    }
    setSearchNbe('');
    setShowNbeDropdown(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditIndex(null);
    setSearchNbe('');
    setShowNbeDropdown(false);
  };

  // Utiliser un ref pour suivre si le modal doit rester ouvert même lors de la perte de focus
  const shouldKeepModalOpenRef = useRef(false);

  // Suivre l'état de visibilité de la page pour empêcher la fermeture du modal
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Si la page devient invisible, marquer qu'on doit garder le modal ouvert
      if (document.visibilityState === 'hidden' && isModalOpen) {
        shouldKeepModalOpenRef.current = true;
      }
      // Si la page redevient visible et que le modal était ouvert, le maintenir ouvert
      if (document.visibilityState === 'visible' && isModalOpen) {
        shouldKeepModalOpenRef.current = false;
        // Forcer le modal à rester ouvert au cas où il aurait été fermé
        setIsModalOpen(true);
      }
    };

    // Écouter aussi les changements de focus de la fenêtre
    const handleWindowBlur = () => {
      if (isModalOpen) {
        shouldKeepModalOpenRef.current = true;
      }
    };

    const handleWindowFocus = () => {
      if (isModalOpen && shouldKeepModalOpenRef.current) {
        shouldKeepModalOpenRef.current = false;
        // S'assurer que le modal reste ouvert
        setIsModalOpen(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isModalOpen]);

  // Gérer la fermeture du Dialog uniquement si c'est une action intentionnelle
  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      // Si on doit garder le modal ouvert (perte de focus de la fenêtre), empêcher la fermeture
      if (shouldKeepModalOpenRef.current || document.hidden || document.visibilityState !== 'visible') {
        // Empêcher la fermeture en restaurant l'état ouvert
        setTimeout(() => {
          setIsModalOpen(true);
        }, 0);
        return;
      }
      // Sinon, c'est une fermeture intentionnelle (clic en dehors ou ESC)
      handleCloseModal();
    } else {
      shouldKeepModalOpenRef.current = false;
      setIsModalOpen(true);
    }
  };

  const handleValidateForm = async () => {
    // Validation
    if (!currentForm.activiteCle.trim()) {
      toast.error('Veuillez renseigner l\'activité clé');
      return;
    }
    if (!currentForm.typeMoyens.trim()) {
      toast.error('Veuillez renseigner le type de moyens');
      return;
    }

    if (!currentForm.ligneNbe || !currentForm.libelleNbe) {
      toast.error('Veuillez sélectionner une ligne NBE');
      return;
    }
    if (!currentForm.quantite || Number(currentForm.quantite) <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }
    if (!currentForm.frequence || Number(currentForm.frequence) <= 0) {
      toast.error('La fréquence doit être supérieure à 0');
      return;
    }
    if (!currentForm.coutUnitaire || Number(currentForm.coutUnitaire) < 0) {
      toast.error('Le coût unitaire doit être supérieur ou égal à 0');
      return;
    }

    setIsSaving(true);
    try {
      const token = (session as any)?.accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editIndex !== null) {
        // Modification
        const ligneToUpdate = lignes[editIndex];
        
        // Si la ligne a un ID et qu'on a un budgetId, sauvegarder immédiatement en base
        if (budgetId && ligneToUpdate.id) {
          try {
            const response = await apiClient.put(
              `/budgets/${budgetId}/lignes/${ligneToUpdate.id}`,
              {
                activiteCle: currentForm.activiteCle.trim(),
                typeMoyens: currentForm.typeMoyens.trim(),
                quantite: currentForm.quantite,
                frequence: currentForm.frequence,
                coutUnitaire: currentForm.coutUnitaire,
                ligneNbe: currentForm.ligneNbe?.trim(),
                libelleNbe: currentForm.libelleNbe?.trim(),
                sourceFinancement: currentForm.sourceFinancement,
              },
              { headers }
            );
            
            // Mettre à jour avec l'ID de la ligne sauvegardée
            const updated = [...lignes];
            updated[editIndex] = { ...currentForm, id: response.data.id };
            onChange(updated);
            toast.success('Dépense modifiée et sauvegardée avec succès');
          } catch (error: any) {
            console.error('Erreur lors de la sauvegarde de la dépense:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde de la dépense');
            return; // Ne pas fermer le modal en cas d'erreur
          }
        } else {
          // Pas encore de budgetId, juste mettre à jour le state local
          const updated = [...lignes];
          updated[editIndex] = { ...currentForm };
          onChange(updated);
          toast.success('Dépense modifiée avec succès');
        }
      } else {
        // Ajout
        const savedForm = { ...currentForm };
        
        if (budgetId) {
          // Sauvegarder immédiatement en base de données
          try {
            const response = await apiClient.post(
              `/budgets/${budgetId}/lignes`,
              {
                activiteCle: currentForm.activiteCle.trim(),
                typeMoyens: currentForm.typeMoyens.trim(),
                quantite: currentForm.quantite,
                frequence: currentForm.frequence,
                coutUnitaire: currentForm.coutUnitaire,
                ligneNbe: currentForm.ligneNbe?.trim(),
                libelleNbe: currentForm.libelleNbe?.trim(),
                sourceFinancement: currentForm.sourceFinancement,
              },
              { headers }
            );
            
            // Ajouter la ligne avec son ID
            const newLigne = { ...currentForm, id: response.data.id };
            onChange([...lignes, newLigne]);
            
            // Stocker l'ID de la dernière ligne ajoutée pour le scroll
            lastAddedIdRef.current = response.data.id;
            
            // Afficher un message de confirmation
            toast.success('✓ Dépense ajoutée et sauvegardée avec succès !', {
              duration: 3000,
            });
            
            // Rouvrir automatiquement le modal avec les informations du précédent (sauf montant)
            setTimeout(() => {
              setCurrentForm({
                activiteCle: savedForm.activiteCle,
                typeMoyens: savedForm.typeMoyens,
                ligneNbe: savedForm.ligneNbe,
                libelleNbe: savedForm.libelleNbe,
                sourceFinancement: savedForm.sourceFinancement,
                quantite: '1',
                frequence: '1',
                coutUnitaire: '0', // Réinitialisé à 0
              });
              setSearchNbe('');
              setShowNbeDropdown(false);
              setIsModalOpen(true);
              
              // Focus sur le champ quantité après réouverture
              setTimeout(() => {
                quantiteInputRef.current?.focus();
              }, 100);
            }, 500);
            
            return; // Ne pas fermer le modal, on le rouvre automatiquement
          } catch (error: any) {
            console.error('Erreur lors de la sauvegarde de la dépense:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde de la dépense');
            return; // Ne pas fermer le modal en cas d'erreur
          }
        } else {
          // Pas encore de budgetId, juste ajouter au state local
          const tempId = `temp-${Date.now()}`;
          const newLigne = { ...currentForm, id: tempId };
          onChange([...lignes, newLigne]);
          
          // Stocker l'ID temporaire pour le scroll
          lastAddedIdRef.current = tempId;
          
          // Afficher un message de confirmation
          toast.success('✓ Dépense ajoutée avec succès !', {
            duration: 3000,
          });
          
          // Rouvrir automatiquement le modal avec les informations du précédent (sauf montant)
          setTimeout(() => {
            setCurrentForm({
              activiteCle: savedForm.activiteCle,
              typeMoyens: savedForm.typeMoyens,
              ligneNbe: savedForm.ligneNbe,
              libelleNbe: savedForm.libelleNbe,
              sourceFinancement: savedForm.sourceFinancement,
              quantite: '1',
              frequence: '1',
              coutUnitaire: '0', // Réinitialisé à 0
            });
            setSearchNbe('');
            setShowNbeDropdown(false);
            setIsModalOpen(true);
            
            // Focus sur le champ quantité après réouverture
            setTimeout(() => {
              quantiteInputRef.current?.focus();
            }, 100);
          }, 500);
          
          // Essayer la sauvegarde automatique via onAutoSave pour créer le budget
          if (onAutoSave) {
            setTimeout(() => {
              onAutoSave().catch(err => {
                console.error('Erreur lors de la sauvegarde automatique:', err);
              });
            }, 300);
          }
          
          return; // Ne pas fermer le modal, on le rouvre automatiquement
        }
      }

      // Pour les modifications, on ferme le modal normalement
      if (editIndex !== null) {
        handleCloseModal();
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async (index: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    const ligneToRemove = lignes[index];
    
    // Si la ligne a un ID et qu'on a un budgetId, supprimer immédiatement en base
    if (budgetId && ligneToRemove.id) {
      setIsSaving(true);
      try {
        const token = (session as any)?.accessToken;
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        await apiClient.delete(
          `/budgets/${budgetId}/lignes/${ligneToRemove.id}`,
          { headers }
        );
        
        // Mettre à jour le state local
        onChange(lignes.filter((_, i) => i !== index));
        toast.success('Dépense supprimée avec succès');
      } catch (error: any) {
        console.error('Erreur lors de la suppression de la dépense:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression de la dépense');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Pas encore de budgetId ou ligne pas encore sauvegardée, juste supprimer du state
      onChange(lignes.filter((_, i) => i !== index));
      toast.success('Dépense supprimée');

      // Sauvegarde automatique après suppression
      if (onAutoSave) {
        setTimeout(() => {
          onAutoSave().catch(err => {
            console.error('Erreur lors de la sauvegarde automatique:', err);
          });
        }, 300);
      }
    }
  };

  const handleUpdateForm = (field: keyof LigneBudgetaire, value: string) => {
    setCurrentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleNbeSelect = (nbeLine: any) => {
    const codeNbe = nbeLine.ligne || '';
    const libelleNbe = nbeLine.libelle || '';
    
    setCurrentForm(prev => ({
      ...prev,
      ligneNbe: codeNbe,
      libelleNbe: libelleNbe,
    }));
    
    setSearchNbe(codeNbe);
    setShowNbeDropdown(false);
    
    // Positionner automatiquement le curseur sur le champ "Quantité"
    setTimeout(() => {
      quantiteInputRef.current?.focus();
    }, 100);
  };

  const getFilteredNbe = () => {
    const search = searchNbe || '';
    return nbeLines.filter(
      (l) =>
        !l.isHeader &&
        (search === '' ||
          l.ligne?.toLowerCase().includes(search.toLowerCase()) ||
          l.libelle?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  // Filtrer les lignes selon le terme de recherche et la source de financement
  const filteredLignes = React.useMemo(() => {
    let filtered = lignes;
    
    // Filtre par source de financement
    if (filterSourceFinancement) {
      filtered = filtered.filter((ligne) => ligne.sourceFinancement === filterSourceFinancement);
    }
    
    // Filtre par terme de recherche (type de moyens, activité clé, code NBE, montant, etc.)
    if (searchTypeMoyens.trim()) {
      const searchTerm = searchTypeMoyens.trim();
      const searchLower = searchTerm.toLowerCase();
      
      // Vérifier si le terme de recherche est un nombre (potentiellement un montant)
      const isNumericSearch = /^\d+$/.test(searchTerm);
      
      filtered = filtered.filter((ligne) => {
        // Recherche dans les champs texte
        const typeMoyensMatch = ligne.typeMoyens?.toLowerCase().includes(searchLower);
        const activiteCleMatch = ligne.activiteCle?.toLowerCase().includes(searchLower);
        const ligneNbeMatch = ligne.ligneNbe?.toLowerCase().includes(searchLower);
        const libelleNbeMatch = ligne.libelleNbe?.toLowerCase().includes(searchLower);
        
        // Recherche dans les montants si le terme est numérique
        let montantMatch = false;
        if (isNumericSearch) {
          const searchNumber = parseInt(searchTerm, 10);
          
          // Calculer le montant de la ligne
          const montant = Number(ligne.quantite || 1) * Number(ligne.frequence || 1) * Number(ligne.coutUnitaire || 0);
          const montantNumber = Math.round(montant);
          
          // Correspondance exacte du montant total
          if (montantNumber === searchNumber) {
            montantMatch = true;
          }
          
          // Recherche dans le coût unitaire (correspondance exacte uniquement)
          const coutUnitaire = Math.round(Number(ligne.coutUnitaire || 0));
          if (coutUnitaire === searchNumber) {
            montantMatch = true;
          }
          
          // Recherche dans la quantité (correspondance exacte uniquement)
          const quantite = Math.round(Number(ligne.quantite || 1));
          if (quantite === searchNumber) {
            montantMatch = true;
          }
          
          // Recherche dans la fréquence (correspondance exacte uniquement)
          const frequence = Math.round(Number(ligne.frequence || 1));
          if (frequence === searchNumber) {
            montantMatch = true;
          }
        }
        
        return typeMoyensMatch || activiteCleMatch || ligneNbeMatch || libelleNbeMatch || montantMatch;
      });
    }
    
    return filtered;
  }, [lignes, searchTypeMoyens, filterSourceFinancement]);

  // Calculer les totaux par type de moyens pour les lignes filtrées
  const totauxParTypeMoyens = React.useMemo(() => {
    const totals: Record<string, number> = {};
    filteredLignes.forEach((ligne) => {
      const montant = Number(ligne.quantite || 1) * Number(ligne.frequence || 1) * Number(ligne.coutUnitaire || 0);
      const typeMoyens = ligne.typeMoyens || 'Autres';
      totals[typeMoyens] = (totals[typeMoyens] || 0) + montant;
    });
    return totals;
  }, [filteredLignes]);

  const total = filteredLignes.reduce(
    (sum, l) =>
      sum + Number(l.quantite || 1) * Number(l.frequence || 1) * Number(l.coutUnitaire || 0),
    0
  );

  // Calculer les totaux par source de financement (toujours à partir de toutes les lignes, pas filtrées)
  const totauxParSource = React.useMemo(() => {
    const totaux: Record<string, number> = {};
    lignes.forEach((ligne) => {
      const source = ligne.sourceFinancement || 'AUTRES';
      const montant = Number(ligne.quantite || 1) * Number(ligne.frequence || 1) * Number(ligne.coutUnitaire || 0);
      totaux[source] = (totaux[source] || 0) + montant;
    });
    console.log('[BudgetStep2] Totaux par source calculés:', totaux);
    console.log('[BudgetStep2] Nombre de lignes:', lignes.length);
    console.log('[BudgetStep2] Clés de totaux:', Object.keys(totaux));
    console.log('[BudgetStep2] totauxParSource sera affiché:', Object.keys(totaux).length > 0);
    return totaux;
  }, [lignes]);

  const totalRecettes = sourcesRecettes.reduce((sum, s) => sum + Number(s.montant || 0), 0);

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

  const calculerMontant = () => {
    return Number(currentForm.quantite || 1) * Number(currentForm.frequence || 1) * Number(currentForm.coutUnitaire || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Dépenses Détaillées
          </h3>
          <p className="text-sm text-slate-600">
            Ajoutez les dépenses prévues pour votre Plan d'Action Annuel
          </p>
        </div>
        <Button onClick={() => handleOpenModal()} className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </Button>
      </div>

      {/* Affichage du total des recettes AVANT le tableau */}
      {sourcesRecettes.length > 0 && lignes.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-green-700">Total des Sources de Financement</p>
                <p className="text-xs text-green-600 mt-1">Montant disponible pour les dépenses</p>
              </div>
              <p className="text-3xl font-bold text-green-700">{totalRecettes.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Champ de recherche et totaux par type de moyens */}
      {lignes.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Filtres de recherche */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Champ de recherche texte */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">
                    Rechercher par Type de moyens, Activité clé, Code NBE ou Montant
                  </label>
                  <Input
                    value={searchTypeMoyens}
                    onChange={(e) => setSearchTypeMoyens(e.target.value)}
                    placeholder="Ex: Carburants, 6012, Consultation, 2000..."
                    className="bg-white"
                  />
                </div>
                
                {/* Dropdown pour filtrer par source de financement */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-blue-800">
                    Filtrer par Source de financement
                  </label>
                  <select
                    value={filterSourceFinancement}
                    onChange={(e) => setFilterSourceFinancement(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Toutes les sources</option>
                    {SOURCE_FINANCEMENTS.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Total des dépenses filtrées (si filtre actif) */}
              {(searchTypeMoyens.trim() || filterSourceFinancement) && (
                <div className="border-t border-blue-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-blue-800">Total des dépenses filtrées :</span>
                    <span className="text-xl font-bold text-blue-800">{total.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des dépenses */}
      {filteredLignes.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="font-bold">Activités clés</TableHead>
                    <TableHead className="font-bold">Type de moyens</TableHead>
                    <TableHead className="font-bold text-center">Qté</TableHead>
                    <TableHead className="font-bold text-center">Fréq.</TableHead>
                    <TableHead className="font-bold text-right">Coût Unitaire</TableHead>
                    <TableHead className="font-bold text-center">Ligne/Code</TableHead>
                    <TableHead className="font-bold">Libellé</TableHead>
                    <TableHead className="font-bold text-center">Source financement</TableHead>
                    <TableHead className="font-bold text-right">Montant de l'activité</TableHead>
                    <TableHead className="font-bold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLignes.map((ligne, index) => {
                    // Trouver l'index original dans lignes pour les actions
                    const originalIndex = lignes.findIndex((l) => 
                      l.id === ligne.id || 
                      (l.activiteCle === ligne.activiteCle && 
                       l.typeMoyens === ligne.typeMoyens && 
                       l.ligneNbe === ligne.ligneNbe)
                    );
                    const montant = Number(ligne.quantite || 1) * Number(ligne.frequence || 1) * Number(ligne.coutUnitaire || 0);
                    // Vérifier si c'est la dernière ligne ajoutée en comparant avec l'ID stocké
                    const isLastAdded = ligne.id === lastAddedIdRef.current;
                    return (
                      <TableRow 
                        key={ligne.id || index} 
                        ref={isLastAdded ? lastRowRef : null}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <TableCell className="max-w-[200px]">
                          <div className="text-sm">{ligne.activiteCle}</div>
                        </TableCell>
                        <TableCell className="max-w-[150px]">
                          <div className="text-sm">{ligne.typeMoyens}</div>
                        </TableCell>
                        <TableCell className="text-center">{ligne.quantite}</TableCell>
                        <TableCell className="text-center">{ligne.frequence}</TableCell>
                        <TableCell className="text-right">{Number(ligne.coutUnitaire).toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono text-blue-600 font-semibold">{ligne.ligneNbe}</span>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="text-sm text-slate-600">{ligne.libelleNbe}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                            {ligne.sourceFinancement}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold">{montant.toLocaleString('fr-FR')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenModal(originalIndex >= 0 ? originalIndex : index)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemove(originalIndex >= 0 ? originalIndex : index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {/* Lignes de total par source de financement - TOUJOURS AFFICHÉES */}
                  {totauxParSource && Object.keys(totauxParSource).length > 0 && (
                    <>
                      {Object.entries(totauxParSource)
                        .sort(([a], [b]) => {
                          const order: Record<string, number> = { FBP: 1, CMU: 2, RP: 3, BE: 4, AUTRES: 5 };
                          return (order[a] || 99) - (order[b] || 99);
                        })
                        .map(([source, totalSource]) => (
                          <TableRow 
                            key={`total-${source}`}
                            className="bg-gray-100 font-bold hover:bg-gray-100 border-t-2 border-gray-400"
                          >
                            <TableCell></TableCell>
                            <TableCell className="text-right font-bold text-slate-800">
                              COÛT DES ACTIVITÉS {source}
                            </TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell></TableCell>
                            <TableCell className="text-center">
                              <span className="px-2 py-1 bg-blue-200 text-blue-900 rounded text-xs font-bold">
                                {source}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-blue-700">
                              {totalSource.toLocaleString('fr-FR')} FCFA
                            </TableCell>
                            <TableCell></TableCell>
                          </TableRow>
                        ))}
                      
                      {/* Ligne de total général */}
                      <TableRow 
                        className="bg-blue-100 font-bold hover:bg-blue-100 border-t-2 border-blue-500"
                      >
                        <TableCell></TableCell>
                        <TableCell className="text-right font-bold text-lg text-blue-900">
                          TOTAL GÉNÉRAL
                        </TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell className="text-center"></TableCell>
                        <TableCell className="text-right font-bold text-lg text-blue-900">
                          {total.toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : lignes.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Aucune dépense ajoutée pour le moment</p>
            <Button onClick={() => handleOpenModal()} className="gap-2">
              <Plus className="w-4 h-4" />
              Ajouter votre première dépense
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-2 border-slate-300">
          <CardContent className="p-8 text-center">
            <Search className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">Aucune dépense ne correspond à votre recherche</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTypeMoyens('');
                setFilterSourceFinancement('');
              }} 
              className="gap-2"
            >
              Réinitialiser les filtres
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Total des dépenses et bouton Valider */}
      <div className="space-y-4 mt-4">
        <Card className="w-full">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700">Total Dépenses</span>
              <span className="text-2xl font-bold text-red-600">{total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            {sourcesRecettes.length > 0 && total > totalRecettes && (
              <p className="text-xs text-red-600 mt-2">
                ⚠️ Le total des dépenses dépasse le total des recettes !
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Bouton Valider - Affiché en pleine largeur */}
        {lignes.length > 0 && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowRecapitulatif(!showRecapitulatif)}
              className="bg-green-600 hover:bg-green-700 text-white px-12 py-3 text-lg font-semibold shadow-lg"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {showRecapitulatif ? 'Masquer le Récapitulatif' : 'Valider et Afficher le Récapitulatif'}
            </Button>
          </div>
        )}
      </div>

      {/* Tableau récapitulatif */}
      {showRecapitulatif && lignes.length > 0 && (
        <Card className="mt-6 border-2 border-blue-300 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <CardTitle className="text-2xl font-bold text-blue-900 text-center">
              Récapitulatif des Coûts par Source de Financement
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableBody>
                  {/* Ligne CMU */}
                  <TableRow className="border-b border-slate-200">
                    <TableCell className="py-4 px-6 font-semibold text-slate-700 text-base bg-slate-50">
                      COÛT DES ACTIVITÉS CMU
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right font-bold text-slate-900 text-lg bg-slate-50">
                      {(totauxParSource['CMU'] || 0).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne RP */}
                  <TableRow className="border-b border-slate-200">
                    <TableCell className="py-4 px-6 font-semibold text-slate-700 text-base">
                      COÛT DES ACTIVITES RP
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right font-bold text-slate-900 text-lg">
                      {(totauxParSource['RP'] || 0).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne BU (BE dans le code) */}
                  <TableRow className="border-b border-slate-200">
                    <TableCell className="py-4 px-6 font-semibold text-slate-700 text-base bg-slate-50">
                      COÛT DES ACTIVITES BU
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right font-bold text-slate-900 text-lg bg-slate-50">
                      {(totauxParSource['BE'] || 0).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne AUTRES RESSOURCES */}
                  <TableRow className="border-b-2 border-slate-400">
                    <TableCell className="py-4 px-6 font-semibold text-slate-700 text-base">
                      COÛT DES ACTIVITES (AUTRES RESSOURCES)
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right font-bold text-slate-900 text-lg">
                      {(totauxParSource['AUTRES'] || 0).toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                  
                  {/* Ligne de total général */}
                  <TableRow className="bg-gradient-to-r from-blue-100 to-indigo-100 border-t-2 border-blue-400">
                    <TableCell className="py-5 px-6 font-bold text-xl text-blue-900">
                      COÛT TOTAL DES ACTIVITÉS
                    </TableCell>
                    <TableCell className="py-5 px-6 text-right font-bold text-2xl text-blue-700">
                      {total.toLocaleString('fr-FR')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            {/* Note de signature */}
            <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-12">Signature</p>
                <div className="border-b-2 border-slate-400 w-48"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal flottant pour ajouter/modifier une dépense */}
      <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onEscapeKeyDown={(e) => {
            // Empêcher la fermeture avec ESC si la page n'est pas visible ou si on doit garder le modal ouvert
            if (shouldKeepModalOpenRef.current || document.hidden || document.visibilityState !== 'visible') {
              e.preventDefault();
            }
          }}
          onPointerDownOutside={(e) => {
            // Empêcher la fermeture au clic en dehors si la page n'est pas visible ou si on doit garder le modal ouvert
            if (shouldKeepModalOpenRef.current || document.hidden || document.visibilityState !== 'visible') {
              e.preventDefault();
            }
          }}
          onInteractOutside={(e) => {
            // Empêcher la fermeture lors des interactions en dehors si la page n'est pas visible ou si on doit garder le modal ouvert
            if (shouldKeepModalOpenRef.current || document.hidden || document.visibilityState !== 'visible') {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editIndex !== null ? 'Modifier une dépense' : 'Ajouter une dépense'}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations de la dépense. Les champs marqués d'un * sont obligatoires.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Activité clé et Type de moyens */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Activité clé *</label>
                <div className="relative">
                  <Input
                    value={currentForm.activiteCle}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleUpdateForm('activiteCle', value);
                      if (value.length >= 2) {
                        setShowActiviteCleDropdown(true);
                      } else {
                        setShowActiviteCleDropdown(false);
                        setActiviteCleSuggestions([]);
                      }
                    }}
                    onFocus={() => {
                      if (currentForm.activiteCle.length >= 2) {
                        setShowActiviteCleDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowActiviteCleDropdown(false), 200);
                    }}
                    placeholder="Ex: Assurer la motivation du personnel"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  {showActiviteCleDropdown && activiteCleSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {activiteCleSuggestions
                        .filter((suggestion) => {
                          const searchLower = currentForm.activiteCle.toLowerCase();
                          return suggestion.toLowerCase().includes(searchLower);
                        })
                        .slice(0, 15)
                        .map((suggestion, i) => (
                          <button
                            key={`activite-${i}-${suggestion}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleUpdateForm('activiteCle', suggestion);
                              setShowActiviteCleDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm transition-colors"
                          >
                            <div className="text-slate-800">{suggestion}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Type de moyens *</label>
                <div className="relative">
                  <Input
                    value={currentForm.typeMoyens}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleUpdateForm('typeMoyens', value);
                      if (value.length >= 2) {
                        setShowTypeMoyensDropdown(true);
                      } else {
                        setShowTypeMoyensDropdown(false);
                        setTypeMoyensSuggestions([]);
                      }
                    }}
                    onFocus={() => {
                      if (currentForm.typeMoyens.length >= 2) {
                        setShowTypeMoyensDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowTypeMoyensDropdown(false), 200);
                    }}
                    placeholder="Ex: Prime ASC T1 2024"
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  {showTypeMoyensDropdown && typeMoyensSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {typeMoyensSuggestions
                        .filter((suggestion) => {
                          const searchLower = currentForm.typeMoyens.toLowerCase();
                          return suggestion.toLowerCase().includes(searchLower);
                        })
                        .slice(0, 15)
                        .map((suggestion, i) => (
                          <button
                            key={`type-${i}-${suggestion}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleUpdateForm('typeMoyens', suggestion);
                              setShowTypeMoyensDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm transition-colors"
                          >
                            <div className="text-slate-800">{suggestion}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ligne NBE et Libellé */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium mb-2">Ligne / Code (NBE) *</label>
                <div className="relative">
                  <Input
                    value={currentForm.ligneNbe || ''}
                    onChange={(e) => {
                      handleUpdateForm('ligneNbe', e.target.value);
                      setSearchNbe(e.target.value);
                      setShowNbeDropdown(true);
                    }}
                    placeholder="Rechercher code NBE (ex: 2411, 6639)"
                    onFocus={() => {
                      setShowNbeDropdown(true);
                      setSearchNbe(currentForm.ligneNbe || '');
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowNbeDropdown(false), 200);
                    }}
                  />
                  <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  {showNbeDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      {(() => {
                        const filtered = getFilteredNbe();
                        const displayItems = filtered.length > 0 ? filtered : nbeLines.slice(0, 20);
                        return displayItems.length > 0 ? (
                          displayItems.slice(0, 15).map((nbe, i) => (
                            <button
                              key={`${nbe.id || i}-${nbe.ligne}`}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleNbeSelect(nbe);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm transition-colors"
                            >
                              <div className="font-mono text-blue-600 font-semibold">{nbe.ligne || 'N/A'}</div>
                              <div className="text-slate-600 text-xs mt-1">{nbe.libelle || ''}</div>
                              {nbe.objetDepense && (
                                <div className="text-slate-400 text-xs mt-1 line-clamp-1">{nbe.objetDepense}</div>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-slate-500">Aucune ligne NBE trouvée</div>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">Recherchez dans la Nomenclature Budgétaire de l'État</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Libellé (NBE) *</label>
                <Input
                  value={currentForm.libelleNbe || ''}
                  readOnly
                  className="bg-slate-50 font-medium"
                  placeholder="Rempli automatiquement depuis NBE"
                />
                {!currentForm.libelleNbe && (
                  <p className="text-xs text-amber-600 mt-1">Sélectionnez une ligne NBE ci-contre</p>
                )}
              </div>
            </div>

            {/* Quantité, Fréquence, Coût Unitaire, Montant */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Quantité *</label>
                <Input
                  ref={quantiteInputRef}
                  type="text"
                  inputMode="decimal"
                  value={currentForm.quantite}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                      handleUpdateForm('quantite', value);
                    }
                  }}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fréquence *</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={currentForm.frequence}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                      handleUpdateForm('frequence', value);
                    }
                  }}
                  placeholder="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Coût Unitaire (FCFA) *</label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={currentForm.coutUnitaire}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                      handleUpdateForm('coutUnitaire', value);
                    }
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Montant</label>
                <Input
                  value={calculerMontant().toLocaleString('fr-FR')}
                  readOnly
                  className="bg-blue-50 font-bold text-blue-700"
                />
              </div>
            </div>

            {/* Source de financement */}
            <div>
              <label className="block text-sm font-medium mb-2">Source de financement *</label>
              <select
                value={currentForm.sourceFinancement}
                onChange={(e) => handleUpdateForm('sourceFinancement', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SOURCE_FINANCEMENTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isSaving}>
              Annuler
            </Button>
            <Button onClick={handleValidateForm} className="bg-blue-600 hover:bg-blue-700" disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : editIndex !== null ? 'Modifier' : 'Valider et ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
