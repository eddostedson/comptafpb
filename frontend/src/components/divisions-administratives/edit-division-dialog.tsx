'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Loader2, MapPin } from 'lucide-react';

interface DivisionAdministrative {
  id: string;
  code?: string;
  region?: string;
  departement?: string;
  chefLieu?: string;
  sousPrefecture?: string;
  commune?: string;
  actif: boolean;
}

interface EditDivisionDialogProps {
  division: DivisionAdministrative | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditDivisionDialog({
  division,
  open,
  onOpenChange,
  onSuccess,
}: EditDivisionDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    region: '',
    departement: '',
    chefLieu: '',
    sousPrefecture: '',
    commune: '',
    actif: true,
  });

  useEffect(() => {
    if (division && open) {
      setFormData({
        code: division.code || '',
        region: division.region || '',
        departement: division.departement || '',
        chefLieu: division.chefLieu || '',
        sousPrefecture: division.sousPrefecture || '',
        commune: division.commune || '',
        actif: division.actif ?? true,
      });
    }
  }, [division, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!division) return;

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload: any = {
        code: formData.code || undefined,
        region: formData.region || undefined,
        departement: formData.departement || undefined,
        chefLieu: formData.chefLieu || undefined,
        sousPrefecture: formData.sousPrefecture || undefined,
        commune: formData.commune || undefined,
        actif: formData.actif,
      };

      // Supprimer les champs vides
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
          payload[key] = undefined;
        }
      });

      const response = await apiClient.put(`/divisions-administratives/${division.id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      // Afficher le message avec les informations sur les centres mis à jour
      const centresUpdated = response.data?.centresUpdated || 0;
      const details = response.data?.details || '';
      
      if (centresUpdated > 0) {
        toast.success('Division administrative modifiée avec succès ! 🎉', {
          description: `La division "${formData.region || formData.commune || 'modifiée'}" a été mise à jour. ${centresUpdated} centre(s) ont été corrigé(s) automatiquement.`,
          duration: 5000,
        });
      } else {
        toast.success('Division administrative modifiée avec succès ! 🎉', {
          description: `La division "${formData.region || formData.commune || 'modifiée'}" a été mise à jour.`,
          duration: 3000,
        });
      }
      
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

  if (!division) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Modifier une division administrative
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Code unique"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Région</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departement">Département</Label>
              <Input
                id="departement"
                value={formData.departement}
                onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chefLieu">Chef-lieu</Label>
              <Input
                id="chefLieu"
                value={formData.chefLieu}
                onChange={(e) => setFormData({ ...formData, chefLieu: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sousPrefecture">Sous-préfecture</Label>
              <Input
                id="sousPrefecture"
                value={formData.sousPrefecture}
                onChange={(e) => setFormData({ ...formData, sousPrefecture: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commune">Commune</Label>
              <Input
                id="commune"
                value={formData.commune}
                onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                placeholder="Ex: Abidjan"
              />
            </div>
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
                'Modifier'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

