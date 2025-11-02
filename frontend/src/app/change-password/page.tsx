'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Lock, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté ou n'a pas besoin de changer son mot de passe, rediriger
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !session?.user?.mustChangePassword) {
      router.push('/home');
    }
  }, [session, status, router]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Le mot de passe actuel est requis';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.currentPassword && formData.newPassword && formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'Le nouveau mot de passe doit être différent de l\'ancien';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      await apiClient.post(
        '/auth/change-password',
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success('Mot de passe changé avec succès !', {
        description: 'Votre nouveau mot de passe a été enregistré. Vous allez être déconnecté pour vous reconnecter avec votre nouveau mot de passe.',
      });

      // Attendre un peu pour que l'utilisateur voie le message
      setTimeout(async () => {
        // Déconnecter l'utilisateur
        await signOut({ redirect: false });
        // Rediriger vers la page de login
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      const message = error.response?.data?.message || 'Une erreur est survenue lors du changement de mot de passe';
      toast.error('Erreur', {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Afficher un loader pendant la vérification de la session
  if (status === 'loading' || (status === 'authenticated' && session?.user?.mustChangePassword === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-muted-foreground">Vérification...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas besoin de changer son mot de passe, ne rien afficher (redirection en cours)
  if (status === 'authenticated' && !session?.user?.mustChangePassword) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <Lock className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Changement de mot de passe requis</CardTitle>
          <CardDescription>
            Pour des raisons de sécurité, vous devez créer un nouveau mot de passe personnel.
            Le mot de passe généré par l'administrateur ne sera plus valable après ce changement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Veuillez entrer le mot de passe fourni par l'administrateur, puis choisir votre nouveau mot de passe personnel.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Mot de passe actuel (fourni par l'admin)</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="Entrez le mot de passe de l'admin"
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                disabled={isLoading}
                required
              />
              {errors.currentPassword && (
                <p className="text-sm text-red-600">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nouveau mot de passe personnel</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Minimum 8 caractères"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                disabled={isLoading}
                required
                minLength={8}
              />
              {errors.newPassword && (
                <p className="text-sm text-red-600">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Retapez votre nouveau mot de passe"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                disabled={isLoading}
                required
                minLength={8}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Changement en cours...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

