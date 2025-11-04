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
import { UserCircle, Loader2 } from 'lucide-react';

interface Chef {
  id: string;
  code: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  centreId?: string;
  regisseurId?: string;
  centre?: {
    id: string;
    code: string;
    nom: string;
  };
  regisseur?: {
    id: string;
    code: string;
    nom: string;
    prenom: string;
  };
}

interface EditChefDialogProps {
  chef: Chef | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Centre {
  id: string;
  code: string;
  nom: string;
}

interface Regisseur {
  id: string;
  code: string;
  nom: string;
  prenom: string;
}

export function EditChefDialog({
  chef,
  open,
  onOpenChange,
  onSuccess,
}: EditChefDialogProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [regisseurs, setRegisseurs] = useState<Regisseur[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    password: '',
    centreId: '',
    regisseurId: '',
  });

  // Charger les données et mettre à jour le formulaire quand le chef change
  useEffect(() => {
    if (open && chef) {
      setFormData({
        nom: chef.nom || '',
        prenom: chef.prenom || '',
        email: chef.email || '',
        telephone: chef.telephone || '',
        password: '', // Ne pas pré-remplir le mot de passe
        centreId: chef.centreId || '',
        regisseurId: chef.regisseurId || '',
      });
    }

    // Charger les centres et régisseurs
    const loadData = async () => {
      try {
        const token = (session as any)?.accessToken;
        const [centresRes, regisseursRes] = await Promise.all([
          apiClient.get('/admin/centres', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
          apiClient.get('/admin/regisseurs', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }),
        ]);
        setCentres(centresRes.data || []);
        setRegisseurs(regisseursRes.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      }
    };

    if (session && open) {
      loadData();
    }
  }, [chef, open, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chef) return;

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || undefined,
        centreId: formData.centreId || undefined,
        regisseurId: formData.regisseurId || undefined,
      };

      // Inclure le mot de passe seulement s'il est renseigné
      if (formData.password.trim()) {
        payload.password = formData.password;
      }

      await apiClient.put(`/admin/chefs-centres/${chef.id}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Chef de centre modifié avec succès ! 🎉', {
        description: `Le chef "${formData.prenom} ${formData.nom}" a été mis à jour.`,
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

  if (!chef) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <UserCircle className="h-6 w-6" />
            Modifier le chef de centre
          </DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du chef de centre <strong>{chef.code}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Dupont"
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
                placeholder="chef@cgcs.cg"
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
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Laissez vide pour ne pas changer"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Laissez ce champ vide si vous ne souhaitez pas modifier le mot de passe
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="centreId">Centre de santé *</Label>
              <select
                id="centreId"
                value={formData.centreId}
                onChange={(e) => setFormData({ ...formData, centreId: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                disabled={isLoading}
              >
                <option value="">Sélectionner un centre</option>
                {centres.map((centre) => (
                  <option key={centre.id} value={centre.id}>
                    {centre.code} - {centre.nom}
                  </option>
                ))}
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
                    {regisseur.code} - {regisseur.prenom} {regisseur.nom}
                  </option>
                ))}
              </select>
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
                'Enregistrer les modifications'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}



