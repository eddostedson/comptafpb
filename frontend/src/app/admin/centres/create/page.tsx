'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Building2, ArrowLeft, Sparkles, MapPin } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import Link from 'next/link';

export default function CreateCentrePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDivision, setIsLoadingDivision] = useState(false);
  const [regisseurs, setRegisseurs] = useState<Array<{ id: string; code: string; nom: string; prenom: string; region: string }>>([]);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    commune: '',
    sousPrefecture: '',
    chefLieu: '',
    departement: '',
    region: '',
    telephone: '',
    email: '',
    type: 'Public',
    niveau: 'CSR–D PUBLIC',
    regisseurId: '',
    actif: true,
  });

  useEffect(() => {
    // Charger les régisseurs pour le select
    const loadRegisseurs = async () => {
      try {
        const token = (session as any)?.accessToken;
        const response = await apiClient.get('/admin/regisseurs', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setRegisseurs(response.data || []);
      } catch (error) {
        console.error('Erreur lors du chargement des régisseurs:', error);
      }
    };

    if (session) {
      loadRegisseurs();
    }
  }, [session]);

  // Auto-complétion basée sur la commune OU la région
  useEffect(() => {
    // Rechercher uniquement si on a au moins 2 caractères dans commune ou région
    const searchTerm = formData.commune || formData.region;
    if (!session || !searchTerm || searchTerm.length < 2) {
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
            search: searchTerm,
          },
        });

        const divisions = response.data?.items || [];
        let matchingDivision = null;

        // Si on cherche par commune, trouver une correspondance exacte
        if (formData.commune && formData.commune.length >= 2) {
          matchingDivision = divisions.find(
            (div: any) => div.commune?.toLowerCase() === formData.commune.toLowerCase()
          );
        }
        
        // Si on cherche par région et qu'on n'a pas trouvé par commune
        if (!matchingDivision && formData.region && formData.region.length >= 2) {
          const matchingByRegion = divisions.filter(
            (div: any) => div.region?.toLowerCase() === formData.region.toLowerCase()
          );
          
          if (matchingByRegion.length > 0) {
            // Si plusieurs divisions ont la même région, prendre celle qui a le plus d'informations complètes
            matchingDivision = matchingByRegion.reduce((best, current) => {
              const bestScore = [best.region, best.departement, best.chefLieu, best.commune].filter(Boolean).length;
              const currentScore = [current.region, current.departement, current.chefLieu, current.commune].filter(Boolean).length;
              return currentScore > bestScore ? current : best;
            });
          }
        }

        if (matchingDivision) {
          // Remplir automatiquement les autres champs UNIQUEMENT s'ils sont vides
          // Ordre de remplissage : Département, Chef-lieu, Sous-préfecture, Région
          setFormData((prev) => {
            const updated = { ...prev };
            
            // Ne remplir que les champs vides, dans l'ordre demandé
            if (!prev.departement && matchingDivision.departement) {
              updated.departement = matchingDivision.departement;
            }
            if (!prev.chefLieu && matchingDivision.chefLieu) {
              updated.chefLieu = matchingDivision.chefLieu;
            }
            if (!prev.sousPrefecture && matchingDivision.sousPrefecture) {
              updated.sousPrefecture = matchingDivision.sousPrefecture;
            }
            if (!prev.region && matchingDivision.region) {
              updated.region = matchingDivision.region;
            }
            
            return updated;
          });

          // Ne montrer le toast que si au moins un champ a été rempli
          const filledFields = [];
          if (!formData.departement && matchingDivision.departement) filledFields.push('Département');
          if (!formData.chefLieu && matchingDivision.chefLieu) filledFields.push('Chef-lieu');
          if (!formData.sousPrefecture && matchingDivision.sousPrefecture) filledFields.push('Sous-préfecture');
          if (!formData.region && matchingDivision.region) filledFields.push('Région');
          
          if (filledFields.length > 0) {
            const searchBy = formData.commune ? `"${formData.commune}"` : `"${formData.region}"`;
            toast.success('Informations chargées automatiquement', {
              description: `Les informations administratives trouvées pour ${searchBy} ont été chargées. ${filledFields.join(', ')} rempli(s).`,
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
  }, [formData.commune, formData.region, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = (session as any)?.accessToken;
      const payload = {
        ...formData,
        email: formData.email?.trim() || undefined,
        telephone: formData.telephone?.trim() || undefined,
        sousPrefecture: formData.sousPrefecture?.trim() || undefined,
        regisseurId: formData.regisseurId || undefined,
      };

      // Créer le centre (la synchronisation avec les divisions administratives se fait automatiquement dans le backend)
      await apiClient.post('/admin/centres', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Centre créé avec succès ! ✨', {
        description: `Le centre "${formData.nom}" a été ajouté au système. Les divisions administratives ont été synchronisées automatiquement.`,
        duration: 3000,
      });
      router.push('/centres');
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
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header moderne */}
          <div className="mb-8 flex items-center gap-4">
            <Link href="/centres">
              <Button variant="outline" size="icon" className="rounded-full hover:scale-110 transition-transform duration-300">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Créer un centre de santé
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Ajouter un nouveau centre de santé au système
              </p>
            </div>
          </div>

          {/* Formulaire flottant et dynamique */}
          <div className="relative">
            {/* Effet de brillance en arrière-plan */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-3xl animate-pulse"></div>
            
            <div className="relative bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 transform transition-all duration-500 hover:shadow-3xl">
              {/* Header du formulaire */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    Informations du centre
                    <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </h2>
                  <p className="text-slate-600 mt-1">Remplissez les informations ci-dessous pour créer un nouveau centre</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Niveau et Nom du centre - EN 2 COLONNES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="niveau" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Niveau *
                    </Label>
                    <select
                      id="niveau"
                      value={formData.niveau}
                      onChange={(e) => setFormData({ ...formData, niveau: e.target.value })}
                      className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                      required
                      disabled={isLoading}
                    >
                      <option value="CSR–D PUBLIC">CSR–D PUBLIC</option>
                      <option value="CSR–DM PUBLIC">CSR–DM PUBLIC</option>
                      <option value="CSUS–PMI PUBLIC">CSUS–PMI PUBLIC</option>
                      <option value="CSUS–DM PUBLIC">CSUS–DM PUBLIC</option>
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="nom" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Nom du centre *
                    </Label>
                    <Input
                      id="nom"
                      placeholder="Centre de Santé de Brazzaville"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Adresse et Commune - EN 2 COLONNES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="adresse" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Adresse *
                    </Label>
                    <Input
                      id="adresse"
                      placeholder="1 Avenue de la Santé"
                      value={formData.adresse}
                      onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="commune" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors flex items-center gap-2">
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
                      placeholder="Beoumi (Département, Chef-lieu, Sous-préfecture, Région se chargeront automatiquement)"
                      value={formData.commune}
                      onChange={(e) => setFormData({ ...formData, commune: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                    {isLoadingDivision && (
                      <p className="text-xs text-slate-500">Recherche des informations administratives...</p>
                    )}
                  </div>
                </div>

                {/* Région et Département */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="region" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors flex items-center gap-2">
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
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="departement" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Département *
                    </Label>
                    <Input
                      id="departement"
                      placeholder="Pool"
                      value={formData.departement}
                      onChange={(e) => setFormData({ ...formData, departement: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Chef-lieu et Sous-préfecture */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="chefLieu" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Chef-lieu *
                    </Label>
                    <Input
                      id="chefLieu"
                      placeholder="Brazzaville"
                      value={formData.chefLieu}
                      onChange={(e) => setFormData({ ...formData, chefLieu: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="sousPrefecture" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Sous-préfecture
                    </Label>
                    <Input
                      id="sousPrefecture"
                      placeholder="Brazzaville (optionnel)"
                      value={formData.sousPrefecture}
                      onChange={(e) => setFormData({ ...formData, sousPrefecture: e.target.value })}
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="telephone" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Téléphone
                    </Label>
                    <Input
                      id="telephone"
                      placeholder="+242 05 001 00 00"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="email" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="centre@cgcs.cg"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={isLoading}
                      className="h-12 text-base border-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl"
                    />
                  </div>
                </div>

                {/* Type et Régisseur - EN 2 COLONNES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label htmlFor="type" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Type *
                    </Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                      required
                      disabled={isLoading}
                    >
                      <option value="Public">Public</option>
                      <option value="Privé">Privé</option>
                      <option value="Confessionnel">Confessionnel</option>
                    </select>
                  </div>
                  <div className="space-y-2 group">
                    <Label htmlFor="regisseurId" className="text-base font-semibold text-slate-700 group-focus-within:text-blue-600 transition-colors">
                      Régisseur
                    </Label>
                    <select
                      id="regisseurId"
                      value={formData.regisseurId}
                      onChange={(e) => setFormData({ ...formData, regisseurId: e.target.value })}
                      className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                      disabled={isLoading}
                    >
                      <option value="">Sélectionner un régisseur (optionnel)</option>
                      {regisseurs.map((regisseur) => (
                        <option key={regisseur.id} value={regisseur.id}>
                          {regisseur.code} - {regisseur.prenom} {regisseur.nom} ({regisseur.region})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-200">
                  <Link href="/centres">
                    <Button 
                      type="button" 
                      variant="outline" 
                      disabled={isLoading}
                      className="h-12 px-8 rounded-xl text-base font-semibold hover:scale-105 transition-transform duration-300"
                    >
                      Annuler
                    </Button>
                  </Link>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="h-12 px-8 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Création...
                      </span>
                    ) : (
                      'Créer le centre'
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
