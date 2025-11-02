'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, MapPin, Phone, Mail, Users, Plus, Pencil, Trash2, MoreVertical, UserCircle, Shield } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { EditCentreDialog } from '@/components/centres/edit-centre-dialog';
import { DeleteCentreDialog } from '@/components/centres/delete-centre-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function CentresPage() {
  const { data: session, status } = useSession();
  const [centres, setCentres] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCentre, setEditingCentre] = useState<any | null>(null);
  const [deletingCentre, setDeletingCentre] = useState<any | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Log initial pour débogage
  console.log('[Centres] Composant rendu, status session:', status);
  console.log('[Centres] Session data:', session);

  useEffect(() => {
    console.log('[Centres] useEffect déclenché, status:', status, 'session:', session ? 'présente' : 'absente');
    const loadCentres = async () => {
      try {
        // Récupérer le token depuis la session
        const token = (session as any)?.accessToken || session?.accessToken;
        console.log('[Centres] Session:', session ? 'présente' : 'absente');
        console.log('[Centres] Token:', token ? 'présent' : 'absent');
        console.log('[Centres] Rôle:', session?.user?.role);
        
        if (!token) {
          console.warn('[Centres] Pas de token, impossible de charger les centres');
          toast.error('Session expirée. Veuillez vous reconnecter.');
          setIsLoading(false);
          return;
        }
        
        console.log('[Centres] Chargement des centres depuis:', apiClient.defaults.baseURL);
        
        const response = await apiClient.get('/admin/centres', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('[Centres] Réponse API reçue:', response.status);
        console.log('[Centres] Données reçues:', response.data);
        
        const centresData = Array.isArray(response.data) ? response.data : [];
        console.log('[Centres] Nombre de centres reçus:', centresData.length);
        
        setCentres(centresData);
        
        if (centresData.length === 0) {
          console.warn('[Centres] Aucun centre retourné par l\'API');
        }
      } catch (error: any) {
        console.error('[Centres] Erreur lors du chargement des centres:', error);
        console.error('[Centres] Status:', error.response?.status);
        console.error('[Centres] Détails:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
        } else if (error.response?.status === 403) {
          toast.error('Accès refusé. Vous n\'avez pas les droits nécessaires.');
        } else {
          toast.error(`Erreur lors du chargement des centres: ${error.message}`);
        }
        
        // Toujours mettre à jour l'état même en cas d'erreur
        setCentres([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Attendre que NextAuth ait terminé le chargement
    if (status === 'loading') {
      console.log('[Centres] Session en cours de chargement...');
      return;
    }

    if (status === 'unauthenticated') {
      console.log('[Centres] Utilisateur non authentifié');
      setIsLoading(false);
      return;
    }

    if (session && status === 'authenticated') {
      console.log('[Centres] Session authentifiée, chargement des centres...');
      loadCentres();
    } else {
      console.log('[Centres] Pas de session disponible, status:', status);
      setIsLoading(false);
    }
  }, [session, status]);

  const loadCentres = async () => {
    try {
      const token = (session as any)?.accessToken || session?.accessToken;
      if (!token) return;

      const response = await apiClient.get('/admin/centres', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const centresData = Array.isArray(response.data) ? response.data : [];
      setCentres(centresData);
    } catch (error: any) {
      console.error('[Centres] Erreur lors du chargement des centres:', error);
      toast.error('Erreur lors du chargement des centres');
    }
  };

  const handleEdit = (centre: any) => {
    setEditingCentre(centre);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (centre: any) => {
    setDeletingCentre(centre);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingCentre) return;

    setIsDeleteLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.delete(`/admin/centres/${deletingCentre.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Centre supprimé avec succès ! 🗑️', {
        description: `Le centre "${deletingCentre.nom}" a été supprimé définitivement.`,
        duration: 4000,
      });

      setIsDeleteDialogOpen(false);
      setDeletingCentre(null);
      loadCentres();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la suppression';
      
      // Message plus clair si c'est une erreur de protection
      if (error.response?.status === 409) {
        toast.error('Suppression impossible ⚠️', {
          description: message,
          duration: 5000,
        });
      } else {
        toast.error('Erreur lors de la suppression', {
          description: message,
          duration: 4000,
        });
      }
    } finally {
      setIsDeleteLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header moderne */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                Centres de Santé
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Gestion des {isLoading ? '...' : centres.length} centres de santé actifs
              </p>
            </div>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin/centres/create">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un centre
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <p className="text-slate-600 text-lg">Chargement...</p>
            </div>
          ) : centres.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 inline-block mb-4">
                <Building2 className="w-12 h-12 text-blue-600" />
              </div>
              <p className="text-slate-600 text-lg mb-4">Aucun centre trouvé</p>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin/centres/create">
                  <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer le premier centre
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {centres.map((centre, index) => (
                <div
                  key={centre.id}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-slate-200 hover:border-blue-300"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {/* Icône avec gradient */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2">
                        {centre.niveau ? `${centre.niveau} ` : ''}{centre.nom}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">{centre.code}</p>
                    </div>
                    {session?.user?.role === 'ADMIN' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 relative z-20"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleEdit(centre)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(centre)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Contenu */}
                  <div className="space-y-3 relative z-10">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{centre.adresse}, {centre.commune}</span>
                  </div>
                  {centre.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{centre.telephone}</span>
                    </div>
                  )}
                  {centre.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{centre.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{centre.type} - {centre.niveau}</span>
                  </div>
                  {centre.chefCentre && (
                    <div className="flex items-center gap-2 text-sm text-purple-600">
                      <UserCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Chef: {centre.chefCentre.prenom} {centre.chefCentre.nom} ({centre.chefCentre.code})</span>
                    </div>
                  )}
                  {centre.regisseur && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">Régisseur: {centre.regisseur.code} - {centre.regisseur.prenom} {centre.regisseur.nom}</span>
                    </div>
                  )}
                    {/* Footer avec actions */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        centre.actif 
                          ? 'bg-green-100 text-green-800 shadow-sm' 
                          : 'bg-red-100 text-red-800 shadow-sm'
                      }`}>
                        {centre.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {session?.user?.role === 'ADMIN' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(centre)}
                            className="h-8 px-2"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(centre)}
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bordure animée */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          )}

          {/* Modale de modification */}
          <EditCentreDialog
            centre={editingCentre}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={loadCentres}
          />

          {/* Modale de suppression */}
          <DeleteCentreDialog
            centre={deletingCentre}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={confirmDelete}
            isLoading={isDeleteLoading}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}




