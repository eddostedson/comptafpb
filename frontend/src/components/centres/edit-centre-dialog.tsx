'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Building2, Loader2 } from 'lucide-react';

interface Centre {
  id: string;
  code: string;
  nom: string;
  adresse: string;
  commune: string;
  sousPrefecture?: string;
  chefLieu?: string;
  departement?: string;
  region: string;
  telephone?: string;
  email?: string;
  type: string;
  niveau: string;
  regisseurId?: string;
  actif: boolean;
  regisseur?: {
    id: string;
    code: string;
    nom: string;
    prenom: string;
    region: string;
  };
}

interface EditCentreDialogProps {
  centre: Centre | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Regisseur {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  region: string;
}

export function EditCentreDialog({
  centre,
  open,
  onOpenChange,
  onSuccess,
}: EditCentreDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDivision, setIsLoadingDivision] = useState(false);
  const [regisseurs, setRegisseurs] = useState<Regisseur[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    commune: '',
    sousPrefecture: '',
    chefLieu: '',
    departement: '',
    region: '',
    telephone: '',
    email: '',
    type: 'Public',
    niveau: 'CSR–D PUBLIC',
    regisseurId: '',
    actif: true,
  });

  // Charger les régisseurs et mettre à jour le formulaire quand le centre change
  useEffect(() => {
    if (open && centre) {
      setFormData({
        nom: centre.nom || '',
        adresse: centre.adresse || '',
        commune: centre.commune || '',
        sousPrefecture: centre.sousPrefecture || '',
        chefLieu: centre.chefLieu || '',
        departement: centre.departement || '',
        region: centre.region || '',
        telephone: centre.telephone || '',
        email: centre.email || '',
        type: centre.type || 'Public',
        niveau: centre.niveau || 'CSR–D PUBLIC',
        regisseurId: centre.regisseurId || '',
        actif: centre.actif ?? true,
      });
    }

    // Charger les régisseurs
    const loadRegisseurs = async () => {
      try {
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/admin/regisseurs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setRegisseurs(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des régisseurs:', error);
      }
    };

    if (session && open) {
      loadRegisseurs();
    }
  }, [centre, open, session]);

  // Auto-complétion basée sur la commune OU la région
  useEffect(() => {
    if (!session || !open) {
      return;
    }

    // Rechercher uniquement si on a au moins 2 caractères dans commune ou région
    const searchTerm = formData.commune || formData.region;
    if (!searchTerm || searchTerm.length < 2) {
      return;
    }

    const searchDivision = async () => {
      setIsLoadingDivision(true);
      try {
        const token = (session as any)?.accessToken;
        
        // Chercher une division administrative correspondante
        const response = await apiClient.get('/divisions-administratives', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          params: {
            page: 1,
            pageSize: 50,
            search: searchTerm,
          },
        });

        const divisions = response.data?.items || [];
        let matchingDivision = null;

        // Si on cherche par commune, trouver une correspondance exacte
        if (formData.commune && formData.commune.length >= 2) {
          matchingDivision = divisions.find(
            (div: any) => div.commune?.toLowerCase() === formData.commune.toLowerCase()
          );
        }
        
        // Si on cherche par région et qu'on n'a pas trouvé par commune
        if (!matchingDivision && formData.region && formData.region.length >= 2) {
          const matchingByRegion = divisions.filter(
            (div: any) => div.region?.toLowerCase() === formData.region.toLowerCase()
          );
          
          if (matchingByRegion.length > 0) {
            // Si plusieurs divisions ont la même région, prendre celle qui a le plus d'informations complètes
            matchingDivision = matchingByRegion.reduce((best, current) => {
              const bestScore = [best.region, best.departement, best.chefLieu, best.commune].filter(Boolean).length;
              const currentScore = [current.region, current.departement, current.chefLieu, current.commune].filter(Boolean).length;
              return currentScore > bestScore ? current : best;
            });
          }
        }

        if (matchingDivision) {
          // Remplir automatiquement les autres champs UNIQUEMENT s'ils sont vides
          // Ordre de remplissage : Département, Chef-lieu, Sous-préfecture, Région
          setFormData((prev) => {
            const updated = { ...prev };
            
            // Ne remplir que les champs vides, dans l'ordre demandé
            if (!prev.departement && matchingDivision.departement) {
              updated.departement = matchingDivision.departement;
            }
            if (!prev.chefLieu && matchingDivision.chefLieu) {
              updated.chefLieu = matchingDivision.chefLieu;
            }
            if (!prev.sousPrefecture && matchingDivision.sousPrefecture) {
              updated.sousPrefecture = matchingDivision.sousPrefecture;
            }
            if (!prev.region && matchingDivision.region) {
              updated.region = matchingDivision.region;
            }
            
            return updated;
          });

          // Ne montrer le toast que si au moins un champ a été rempli
          const filledFields = [];
          if (!formData.departement && matchingDivision.departement) filledFields.push('Département');
          if (!formData.chefLieu && matchingDivision.chefLieu) filledFields.push('Chef-lieu');
          if (!formData.sousPrefecture && matchingDivision.sousPrefecture) filledFields.push('Sous-préfecture');
          if (!formData.region && matchingDivision.region) filledFields.push('Région');
          
          if (filledFields.length > 0) {
            const searchBy = formData.commune ? `"${formData.commune}"` : `"${formData.region}"`;
            toast.success('Informations chargées automatiquement', {
              description: `Les informations administratives trouvées pour ${searchBy} ont été chargées. ${filledFields.join(', ')} rempli(s).`,
              duration: 3000,
            });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la recherche de division administrative:', error);
      } finally {
        setIsLoadingDivision(false);
      }
    };

    // Debounce pour éviter trop de requêtes
    const timeoutId = setTimeout(() => {
      searchDivision();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.commune, formData.region, session, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centre) return;

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload = {
        ...formData,
        email: formData.email?.trim() || undefined,
        telephone: formData.telephone?.trim() || undefined,
        sousPrefecture: formData.sousPrefecture?.trim() || undefined,
        regisseurId: formData.regisseurId || undefined,
      };

      const response = await apiClient.put(`/admin/centres/${centre.id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // La synchronisation avec les divisions administratives se fait automatiquement dans le backend
      // On peut afficher un message si des modifications ont été détectées
      
      toast.success('Centre modifié avec succès ! 🎉', {
        description: `Le centre "${formData.nom}" a été mis à jour. Les divisions administratives ont été synchronisées automatiquement.`,
        duration: 3000,
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error('Erreur lors de la modification', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!centre) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6" />
            Modifier le centre
          </DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du centre <strong>{centre.code}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Niveau - DÉPLACÉ EN PREMIER */}
          <div className="space-y-2">
            <Label htmlFor="niveau">Niveau *</Label>
            <select
              id="niveau"
              value={formData.niveau}
              onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={isLoading}
            >
              <option value="CSR–D PUBLIC">CSR–D PUBLIC</option>
              <option value="CSR–DM PUBLIC">CSR–DM PUBLIC</option>
              <option value="CSUS–PMI PUBLIC">CSUS–PMI PUBLIC</option>
              <option value="CSUS–DM PUBLIC">CSUS–DM PUBLIC</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du centre *</Label>
              <Input
                id="nom"
                placeholder="Centre de Santé de Brazzaville"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code du centre</Label>
              <Input
                id="code"
                value={centre.code}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse *</Label>
            <Input
              id="adresse"
              placeholder="1 Avenue de la Santé"
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          {/* Commune - DÉPLACÉ AVANT RÉGION */}
          <div className="space-y-2">
            <Label htmlFor="commune" className="flex items-center gap-2">
              Commune *
              {isLoadingDivision && (
                <span className="text-xs text-blue-600 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                  Recherche...
                </span>
              )}
            </Label>
            <Input
              id="commune"
              placeholder="Beoumi (Département, Chef-lieu, Sous-préfecture, Région se chargeront automatiquement)"
              value={formData.commune}
              onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
              required
              disabled={isLoading}
            />
            {isLoadingDivision && (
              <p className="text-xs text-slate-500">Recherche des informations administratives...</p>
            )}
          </div>

          {/* Région et Département */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Région *</Label>
              <Input
                id="region"
                placeholder="Brazzaville"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="departement">Département *</Label>
              <Input
                id="departement"
                placeholder="Pool"
                value={formData.departement}
                onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Chef-lieu et Sous-préfecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chefLieu">Chef-lieu *</Label>
              <Input
                id="chefLieu"
                placeholder="Brazzaville"
                value={formData.chefLieu}
                onChange={(e) => setFormData({ ...formData, chefLieu: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sousPrefecture">Sous-préfecture</Label>
              <Input
                id="sousPrefecture"
                placeholder="Brazzaville (optionnel)"
                value={formData.sousPrefecture}
                onChange={(e) => setFormData({ ...formData, sousPrefecture: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                placeholder="+242 05 001 00 00"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="centre@cgcs.cg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Type *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
              disabled={isLoading}
            >
              <option value="Public">Public</option>
              <option value="Privé">Privé</option>
              <option value="Confessionnel">Confessionnel</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="regisseurId">Régisseur</Label>
            <select
              id="regisseurId"
              value={formData.regisseurId}
              onChange={(e) => setFormData({ ...formData, regisseurId: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
            >
              <option value="">Sélectionner un régisseur (optionnel)</option>
              {regisseurs.map((regisseur) => (
                <option key={regisseur.id} value={regisseur.id}>
                  {regisseur.code} - {regisseur.prenom} {regisseur.nom} ({regisseur.region})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="actif"
              checked={formData.actif}
              onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              disabled={isLoading}
            />
            <Label htmlFor="actif" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Centre actif
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                'Enregistrer les modifications'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

