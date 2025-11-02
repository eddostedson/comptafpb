'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { UserPlus, Loader2, X } from 'lucide-react';

interface ChefCentre {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  centre?: {
    code: string;
    nom: string;
  };
  regisseur?: {
    id: string;
    code: string;
  };
}

interface AssocierChefsDialogProps {
  regisseurId: string;
  regisseurNom: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AssocierChefsDialog({
  regisseurId,
  regisseurNom,
  open,
  onOpenChange,
  onSuccess,
}: AssocierChefsDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [chefsCentres, setChefsCentres] = useState<ChefCentre[]>([]);
  const [selectedChefs, setSelectedChefs] = useState<string[]>([]);

  // Charger les chefs de centres disponibles lors de l'ouverture
  useEffect(() => {
    const loadChefsCentres = async () => {
      if (!open || !session) return;

      try {
        setIsLoading(true);
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/admin/chefs-centres', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        // Filtrer pour ne montrer que les chefs qui ne sont pas déjà associés à un régisseur
        const chefs = (response.data || []).filter((chef: ChefCentre) => !chef.regisseur || chef.regisseur.id !== regisseurId);
        setChefsCentres(chefs);
      } catch (error) {
        console.error('Erreur lors du chargement des chefs de centres:', error);
        toast.error('Erreur lors du chargement des chefs de centres');
      } finally {
        setIsLoading(false);
      }
    };

    loadChefsCentres();
  }, [open, session, regisseurId]);

  // Réinitialiser la sélection quand la modale se ferme
  useEffect(() => {
    if (!open) {
      setSelectedChefs([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (selectedChefs.length === 0) {
      toast.error('Veuillez sélectionner au moins un chef de centre');
      return;
    }

    setIsLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.post(
        `/admin/regisseurs/${regisseurId}/associer-chefs-centres`,
        { chefsCentresIds: selectedChefs },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );

      toast.success('Chefs de centres associés avec succès ! ✅', {
        description: `${selectedChefs.length} chef(s) de centre associé(s) au régisseur "${regisseurNom}".`,
        duration: 3000,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de l\'association';
      toast.error('Erreur lors de l\'association', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Associer des chefs de centres
          </DialogTitle>
          <div className="text-sm text-muted-foreground pt-2">
            Sélectionnez un ou plusieurs chefs de centres à associer au régisseur{' '}
            <strong className="text-foreground">{regisseurNom}</strong>.
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Sélection multiple des chefs de centres */}
          <div className="space-y-2">
            <Label htmlFor="chefs-centres-select">Chefs de centres disponibles</Label>
            <select
              id="chefs-centres-select"
              multiple
              className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions);
                const selectedIds = options.map((option) => option.value);
                setSelectedChefs(selectedIds);
              }}
              disabled={isLoading}
              value={selectedChefs}
            >
              {chefsCentres.length === 0 ? (
                <option disabled>Tous les chefs de centres sont déjà associés à un régisseur</option>
              ) : (
                chefsCentres.map((chef) => (
                  <option key={chef.id} value={chef.id}>
                    {chef.code} - {chef.prenom} {chef.nom}{' '}
                    {chef.centre ? `(${chef.centre.code} - ${chef.centre.nom})` : ''}
                  </option>
                ))
              )}
            </select>
            <p className="text-xs text-muted-foreground">
              Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs chefs de centres
            </p>
          </div>

          {/* Affichage des chefs sélectionnés */}
          {selectedChefs.length > 0 && (
            <div className="space-y-2">
              <Label>Chefs sélectionnés ({selectedChefs.length})</Label>
              <div className="flex flex-wrap gap-2">
                {selectedChefs.map((chefId) => {
                  const chef = chefsCentres.find((c) => c.id === chefId);
                  if (!chef) return null;
                  return (
                    <div
                      key={chefId}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm border border-primary/20"
                    >
                      <span>
                        {chef.code} - {chef.prenom} {chef.nom}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChefs(selectedChefs.filter((id) => id !== chefId));
                        }}
                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5"
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || selectedChefs.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Association...
              </>
            ) : (
              `Associer ${selectedChefs.length > 0 ? `${selectedChefs.length} ` : ''}chef(s)`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

