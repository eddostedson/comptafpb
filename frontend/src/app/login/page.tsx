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
import { LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

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
        toast.error('Identifiants invalides');
      } else {
        toast.success('Connexion réussie !');
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
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
              <Label htmlFor="password">Mot de passe</Label>
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Connexion...' : 'Se connecter'}
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
    </div>
  );
}

