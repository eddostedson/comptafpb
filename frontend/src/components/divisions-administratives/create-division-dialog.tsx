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

interface CreateDivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDivisionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateDivisionDialogProps) {
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
    if (!open) {
      // Réinitialiser le formulaire quand le dialog se ferme
      setFormData({
        code: '',
        region: '',
        departement: '',
        chefLieu: '',
        sousPrefecture: '',
        commune: '',
        actif: true,
      });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (payload[key] === '' || payload[key] === undefined) {
          delete payload[key];
        }
      });

      await apiClient.post('/divisions-administratives', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Division administrative créée avec succès ! 🎉', {
        description: `La division "${formData.region || formData.commune || 'nouvelle'}" a été créée.`,
        duration: 3000,
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error('Erreur lors de la création', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            Créer une division administrative
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code (optionnel)</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="Généré automatiquement si vide"
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
                  Création...
                </>
              ) : (
                'Créer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}






