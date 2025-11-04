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
import { Users, Loader2 } from 'lucide-react';

interface Regisseur {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  region: string;
  actif?: boolean;
}

interface EditRegisseurDialogProps {
  regisseur: Regisseur | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditRegisseurDialog({
  regisseur,
  open,
  onOpenChange,
  onSuccess,
}: EditRegisseurDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    region: '',
    actif: true,
  });

  // Charger les données et mettre à jour le formulaire quand le régisseur change
  useEffect(() => {
    if (open && regisseur) {
      setFormData({
        code: regisseur.code || '',
        nom: regisseur.nom || '',
        prenom: regisseur.prenom || '',
        email: regisseur.email || '',
        telephone: regisseur.telephone || '',
        region: regisseur.region || '',
        actif: regisseur.actif ?? true,
      });
    }
  }, [regisseur, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regisseur) return;

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload: any = {
        code: formData.code,
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || undefined,
        region: formData.region,
        actif: formData.actif,
      };

      await apiClient.put(`/admin/regisseurs/${regisseur.id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Régisseur modifié avec succès ! 🎉', {
        description: `Le régisseur "${formData.prenom} ${formData.nom}" a été mis à jour.`,
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

  if (!regisseur) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6" />
            Modifier le régisseur
          </DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du régisseur <strong>{regisseur.code}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="REG-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                placeholder="Jean"
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                placeholder="Martin"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean.martin@cgcs.cg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                placeholder="+242 06 123 45 67"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="actif"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="actif" className="font-normal cursor-pointer">
                Régisseur actif
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Désactivez cette option pour marquer le régisseur comme inactif
            </p>
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



