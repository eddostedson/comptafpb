'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft, Search, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import Link from 'next/link';

export default function CreateChefCentrePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [centres, setCentres] = useState<Array<{ id: string; code: string; nom: string; regisseurId?: string }>>([]);
  const [centreSearch, setCentreSearch] = useState('');
  const [isCentreDropdownOpen, setIsCentreDropdownOpen] = useState(false);
  const centreSearchRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    code: '',
    telephone: '',
    centreId: '',
    regisseurId: '',
  });

  useEffect(() => {
    // Charger les centres pour le select
    const loadCentres = async () => {
      try {
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/admin/centres', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setCentres(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des centres:', error);
      }
    };

    if (session) {
      loadCentres();
    }
  }, [session]);

  // Filtrer les centres par recherche
  const allFilteredCentres = centres.filter((centre) => {
    if (!centreSearch) return true;
    const searchTerm = centreSearch.toLowerCase();
    return (
      centre.nom.toLowerCase().includes(searchTerm) ||
      centre.code.toLowerCase().includes(searchTerm)
    );
  });
  
  const filteredCentres = allFilteredCentres.slice(0, 10); // Limiter à 10 résultats pour la performance

  // Mettre à jour le régisseurId quand un centre est sélectionné
  const handleCentreSelect = (centreId: string) => {
    const selectedCentre = centres.find((c) => c.id === centreId);
    if (selectedCentre) {
      setFormData({
        ...formData,
        centreId,
        regisseurId: selectedCentre.regisseurId || '',
      });
      setCentreSearch(`${selectedCentre.code} - ${selectedCentre.nom}`);
      setIsCentreDropdownOpen(false);
    }
  };

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (centreSearchRef.current && !centreSearchRef.current.contains(event.target as Node)) {
        setIsCentreDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Afficher le nom du centre sélectionné dans la recherche
  useEffect(() => {
    if (formData.centreId) {
      const selectedCentre = centres.find((c) => c.id === formData.centreId);
      if (selectedCentre) {
        setCentreSearch(`${selectedCentre.code} - ${selectedCentre.nom}`);
      }
    }
  }, [formData.centreId, centres]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider que un centre est sélectionné
    if (!formData.centreId) {
      toast.error('Veuillez sélectionner un centre');
      setIsCentreDropdownOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload = {
        ...formData,
        code: formData.code || undefined,
        telephone: formData.telephone || undefined,
        regisseurId: formData.regisseurId || undefined,
      };

      await apiClient.post('/admin/chefs-centres', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Chef de centre créé avec succès ! 🎉', {
        description: `Le chef "${formData.prenom} ${formData.nom}" a été créé avec succès.`,
        duration: 3000,
      });
      router.push('/admin/chefs-centres');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/chefs-centres">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Créer un chef de centre</h1>
            <p className="text-muted-foreground">Ajouter un nouveau chef de centre au système</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Informations du chef de centre
            </CardTitle>
            <CardDescription>Remplissez les informations ci-dessous pour créer un nouveau chef de centre</CardDescription>
          </CardHeader>
          <CardContent>
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
                    placeholder="chef@centre.cg"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 caractères"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code (optionnel)</Label>
                  <Input
                    id="code"
                    placeholder="CC-001 (généré automatiquement si vide)"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
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
                <Label htmlFor="centreId">Centre *</Label>
                <div ref={centreSearchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="centreId"
                      type="text"
                      placeholder="Tapez pour rechercher un centre (ex: ahok)..."
                      value={centreSearch}
                      onChange={(e) => {
                        setCentreSearch(e.target.value);
                        setIsCentreDropdownOpen(true);
                        if (!e.target.value) {
                          setFormData({
                            ...formData,
                            centreId: '',
                            regisseurId: '',
                          });
                        }
                      }}
                      onFocus={() => setIsCentreDropdownOpen(true)}
                      disabled={isLoading}
                      className="pl-10"
                    />
                    {formData.centreId && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  {isCentreDropdownOpen && (filteredCentres.length > 0 || !centreSearch) && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {(centreSearch ? filteredCentres : centres.slice(0, 10)).map((centre) => (
                        <div
                          key={centre.id}
                          onClick={() => handleCentreSelect(centre.id)}
                          className={`px-4 py-2 cursor-pointer hover:bg-blue-50 transition-colors ${
                            formData.centreId === centre.id ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{centre.code} - {centre.nom}</span>
                            {formData.centreId === centre.id && (
                              <Check className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                      {(!centreSearch && centres.length > 10) && (
                        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                          {centres.length - 10} autre(s) centre(s). Tapez pour filtrer.
                        </div>
                      )}
                      {centreSearch && allFilteredCentres.length > 10 && (
                        <div className="px-4 py-2 text-xs text-muted-foreground border-t">
                          {allFilteredCentres.length - 10} autre(s) résultat(s). Affinez votre recherche.
                        </div>
                      )}
                    </div>
                  )}
                  
                  {isCentreDropdownOpen && centreSearch && allFilteredCentres.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                      <div className="px-4 py-2 text-sm text-muted-foreground">
                        Aucun centre trouvé pour &quot;{centreSearch}&quot;
                      </div>
                    </div>
                  )}
                </div>
                {formData.centreId && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Centre sélectionné
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Link href="/admin/chefs-centres">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer le chef de centre'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

