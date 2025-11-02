'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Users, ArrowLeft, UserPlus, X, Building2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import Link from 'next/link';

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
}

export default function CreateRegisseurPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDivision, setIsLoadingDivision] = useState(false);
  const [chefsCentres, setChefsCentres] = useState<ChefCentre[]>([]);
  const [selectedChefs, setSelectedChefs] = useState<string[]>([]);
  const [centres, setCentres] = useState<Array<{ id: string; code: string; nom: string; region?: string }>>([]);
  const [selectedCentres, setSelectedCentres] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    commune: '',
    region: '',
  });

  // Charger les chefs de centres disponibles
  useEffect(() => {
    const loadChefsCentres = async () => {
      try {
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/admin/chefs-centres', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setChefsCentres(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des chefs de centres:', error);
      }
    };

    if (session) {
      loadChefsCentres();
    }
  }, [session]);

  // Charger les centres disponibles
  useEffect(() => {
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

  // Auto-complétion basée sur la commune pour charger automatiquement la région
  useEffect(() => {
    // Rechercher uniquement si on a au moins 2 caractères dans commune
    if (!session || !formData.commune || formData.commune.length < 2) {
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
            search: formData.commune,
          },
        });

        const divisions = response.data?.items || [];
        
        // Trouver une correspondance exacte par commune
        const matchingDivision = divisions.find(
          (div: any) => div.commune?.toLowerCase() === formData.commune.toLowerCase()
        );

        if (matchingDivision && matchingDivision.region) {
          // Remplir automatiquement la région uniquement si elle est vide
          if (!formData.region) {
            setFormData((prev) => ({
              ...prev,
              region: matchingDivision.region,
            }));
            
            toast.success('Région chargée automatiquement', {
              description: `La région "${matchingDivision.region}" a été chargée depuis la commune "${formData.commune}".`,
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
  }, [formData.commune, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload: any = {
        nom: formData.nom,
        prenom: formData.prenom,
        email: formData.email,
        telephone: formData.telephone || undefined,
        region: formData.region,
        chefsCentresIds: selectedChefs.length > 0 ? selectedChefs : undefined,
        centresIds: selectedCentres.length > 0 ? selectedCentres : undefined,
      };

      await apiClient.post('/admin/regisseurs', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const associations = [];
      if (selectedCentres.length > 0) associations.push(`${selectedCentres.length} centre(s)`);
      if (selectedChefs.length > 0) associations.push(`${selectedChefs.length} chef(s) de centre`);
      
      const message = associations.length > 0
        ? `Le régisseur "${formData.prenom} ${formData.nom}" a été créé avec succès et ${associations.join(' et ')} associé(s).`
        : `Le régisseur "${formData.prenom} ${formData.nom}" a été créé avec succès.`;

      toast.success('Régisseur créé avec succès ! 🎉', {
        description: message,
        duration: 3000,
      });
      router.push('/regisseurs');
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
          <Link href="/regisseurs">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Créer un régisseur</h1>
            <p className="text-muted-foreground">Ajouter un nouveau régisseur au système</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Informations du régisseur
            </CardTitle>
            <CardDescription>Remplissez les informations ci-dessous pour créer un nouveau régisseur</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Commune - AVANT RÉGION */}
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
                  placeholder="Beoumi (Région se chargera automatiquement)"
                  value={formData.commune}
                  onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                  required
                  disabled={isLoading}
                />
                {isLoadingDivision && (
                  <p className="text-xs text-muted-foreground">Recherche des informations administratives...</p>
                )}
              </div>

              {/* Région */}
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-2">
                  Région *
                  {isLoadingDivision && (!formData.commune || formData.commune.length < 2) && (
                    <span className="text-xs text-blue-600 flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      Recherche...
                    </span>
                  )}
                </Label>
                <Input
                  id="region"
                  placeholder="Brazzaville"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  required
                  disabled={isLoading}
                />
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

              {/* Section association des centres */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">Associer des centres (optionnel)</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un ou plusieurs centres à associer directement à ce régisseur lors de la création.
                </p>

                {/* Sélection multiple des centres */}
                <div className="space-y-2">
                  <Label htmlFor="centres">Centres disponibles</Label>
                  <select
                    id="centres"
                    multiple
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      const selectedIds = options.map((option) => option.value);
                      setSelectedCentres(selectedIds);
                    }}
                    disabled={isLoading}
                    value={selectedCentres}
                  >
                    {centres.map((centre) => (
                      <option key={centre.id} value={centre.id}>
                        {centre.code} - {centre.nom} {centre.region ? `(${centre.region})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Maintenez Ctrl (Windows) ou Cmd (Mac) pour sélectionner plusieurs centres
                  </p>
                </div>

                {/* Affichage des centres sélectionnés */}
                {selectedCentres.length > 0 && (
                  <div className="space-y-2">
                    <Label>Centres sélectionnés ({selectedCentres.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedCentres.map((centreId) => {
                        const centre = centres.find((c) => c.id === centreId);
                        if (!centre) return null;
                        return (
                          <div
                            key={centreId}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md text-sm border border-primary/20"
                          >
                            <span>
                              {centre.code} - {centre.nom}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCentres(selectedCentres.filter((id) => id !== centreId));
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

              {/* Section association des chefs de centres */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <Label className="text-base font-semibold">Associer des chefs de centres (optionnel)</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sélectionnez un ou plusieurs chefs de centres à associer à ce régisseur lors de la création.
                </p>

                {/* Sélection multiple des chefs de centres */}
                <div className="space-y-2">
                  <Label htmlFor="chefs-centres">Chefs de centres disponibles</Label>
                  <select
                    id="chefs-centres"
                    multiple
                    className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    onChange={(e) => {
                      const options = Array.from(e.target.selectedOptions);
                      const selectedIds = options.map((option) => option.value);
                      setSelectedChefs(selectedIds);
                    }}
                    disabled={isLoading}
                    value={selectedChefs}
                  >
                    {chefsCentres.map((chef) => (
                      <option key={chef.id} value={chef.id}>
                        {chef.code} - {chef.prenom} {chef.nom} {chef.centre ? `(${chef.centre.code} - ${chef.centre.nom})` : ''}
                      </option>
                    ))}
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

              <div className="flex justify-end gap-4">
                <Link href="/regisseurs">
                  <Button type="button" variant="outline" disabled={isLoading}>
                    Annuler
                  </Button>
                </Link>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer le régisseur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

