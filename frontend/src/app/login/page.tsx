'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Lock, X } from 'lucide-react';
import { BackendStatusIndicator } from '@/components/backend-status-indicator';
import { useBackendStatus } from '@/hooks/use-backend-status';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const { isOnline } = useBackendStatus(10000);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [resetEmail, setResetEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Afficher un message d'erreur plus détaillé
        let errorMessage = 'Identifiants invalides';
        if (result.error === 'CredentialsSignin') {
          errorMessage = 'Email ou mot de passe incorrect';
        } else if (result.error === 'Configuration') {
          errorMessage = 'Erreur de configuration. Vérifiez que le backend est démarré sur le port 3001';
        } else {
          errorMessage = result.error;
        }
        toast.error(errorMessage);
      } else {
        // Vérifier si l'utilisateur doit changer son mot de passe
        const sessionData = await fetch('/api/auth/session').then(res => res.json());
        
        if (sessionData?.user?.mustChangePassword) {
          toast.info('Changement de mot de passe requis', {
            description: 'Vous devez changer votre mot de passe avant de continuer.',
          });
          router.push('/change-password');
        } else {
          toast.success('Connexion réussie !');
          router.push('/home');
        }
        router.refresh();
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      toast.error('Une erreur est survenue. Vérifiez que le backend est démarré.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);

    try {
      await apiClient.post('/auth/password-reset-request', {
        email: resetEmail,
      });

      toast.success('Demande envoyée avec succès !', {
        description: 'Votre demande de réinitialisation de mot de passe a été envoyée à l\'administrateur. Vous recevrez votre nouveau mot de passe une fois qu\'il aura été généré.',
      });
      setIsResetDialogOpen(false);
      setResetEmail('');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la demande';
      toast.error('Erreur lors de la demande', {
        description: message,
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-primary-foreground p-3 rounded-full">
              <LogIn className="w-6 h-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">CGCS</CardTitle>
          <CardDescription className="text-center">
            Comptabilité de Gestion des Centres de Santé
          </CardDescription>
          {/* Indicateur de statut Backend */}
          <div className="flex justify-center mt-4">
            <BackendStatusIndicator variant="default" showLabel={true} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemple@cgcs.cg"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <button
                  type="button"
                  onClick={() => setIsResetDialogOpen(true)}
                  className="text-xs text-primary hover:underline"
                  disabled={isLoading}
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isOnline}>
              {isLoading ? 'Connexion...' : isOnline ? 'Se connecter' : 'Backend hors ligne'}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Comptes de test</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Admin: admin@cgcs.cg / admin123</p>
              <p>• Régisseur: regisseur1@cgcs.cg / regisseur123</p>
              <p>• Chef: chef1@cgcs.cg / chef123</p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">Pas encore de compte ? </span>
            <Link href="/register" className="text-primary hover:underline">
              S&apos;inscrire
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de demande de réinitialisation */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <DialogTitle>Demander une réinitialisation de mot de passe</DialogTitle>
            </div>
            <DialogDescription>
              Entrez votre email pour demander une réinitialisation de mot de passe. 
              Seuls les chefs de centre et les régisseurs peuvent faire cette demande. L'administrateur générera un nouveau mot de passe pour vous.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="chef@centre.cg"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                disabled={isResetLoading}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetEmail('');
                }}
                disabled={isResetLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isResetLoading || !isOnline}>
                {isResetLoading ? 'Envoi...' : 'Envoyer la demande'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

