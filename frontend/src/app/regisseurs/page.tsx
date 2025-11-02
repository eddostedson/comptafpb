'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Users, MapPin, Phone, Mail, Building2, Plus, Pencil, Trash2, MoreVertical, UserCircle, ChevronDown, ChevronRight, X, UserPlus } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { EditRegisseurDialog } from '@/components/regisseurs/edit-regisseur-dialog';
import { DeleteRegisseurDialog } from '@/components/regisseurs/delete-regisseur-dialog';
import { DissocierUserDialog } from '@/components/regisseurs/dissocier-user-dialog';
import { DissocierCentreDialog } from '@/components/regisseurs/dissocier-centre-dialog';
import { AssocierChefsDialog } from '@/components/regisseurs/associer-chefs-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function RegisseursPage() {
  const { data: session } = useSession();
  const [regisseurs, setRegisseurs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRegisseur, setEditingRegisseur] = useState<any | null>(null);
  const [deletingRegisseur, setDeletingRegisseur] = useState<any | null>(null);
  const [dissociatingUser, setDissociatingUser] = useState<{ user: any; regisseurNom: string } | null>(null);
  const [dissociatingCentre, setDissociatingCentre] = useState<{ centre: any; regisseurNom: string } | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isDissociatingLoading, setIsDissociatingLoading] = useState(false);
  const [isDissociatingCentreLoading, setIsDissociatingCentreLoading] = useState(false);
  const [associatingRegisseur, setAssociatingRegisseur] = useState<{ id: string; nom: string } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDissocierDialogOpen, setIsDissocierDialogOpen] = useState(false);
  const [isDissocierCentreDialogOpen, setIsDissocierCentreDialogOpen] = useState(false);
  const [isAssocierDialogOpen, setIsAssocierDialogOpen] = useState(false);

  const loadRegisseurs = async () => {
    try {
      const token = (session as any)?.accessToken;
      const response = await apiClient.get('/admin/regisseurs', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRegisseurs(response.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des régisseurs:', error);
      toast.error('Erreur lors du chargement des régisseurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadRegisseurs();
    }
  }, [session]);

  const handleEdit = (regisseur: any) => {
    setEditingRegisseur(regisseur);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (regisseur: any) => {
    setDeletingRegisseur(regisseur);
    setIsDeleteDialogOpen(true);
  };

  const handleAssocierChefs = (regisseur: any) => {
    setAssociatingRegisseur({ id: regisseur.id, nom: `${regisseur.prenom} ${regisseur.nom}` });
    setIsAssocierDialogOpen(true);
  };

  const handleDissocierUtilisateur = (user: any, regisseurNom: string) => {
    setDissociatingUser({ user, regisseurNom });
    setIsDissocierDialogOpen(true);
  };

  const handleDissocierCentre = (centre: any, regisseurNom: string) => {
    setDissociatingCentre({ centre, regisseurNom });
    setIsDissocierCentreDialogOpen(true);
  };

  const confirmDissocier = async () => {
    if (!dissociatingUser) return;

    setIsDissociatingLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.post(`/admin/users/${dissociatingUser.user.id}/dissocier-regisseur`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Utilisateur dissocié avec succès ! ✅', {
        description: `"${dissociatingUser.user.prenom} ${dissociatingUser.user.nom}" a été dissocié du régisseur "${dissociatingUser.regisseurNom}".`,
        duration: 3000,
      });

      setIsDissocierDialogOpen(false);
      setDissociatingUser(null);
      loadRegisseurs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la dissociation';
      toast.error('Erreur lors de la dissociation', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsDissociatingLoading(false);
    }
  };

  const confirmDissocierCentre = async () => {
    if (!dissociatingCentre) return;

    setIsDissociatingCentreLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.post(`/admin/centres/${dissociatingCentre.centre.id}/dissocier-regisseur`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Centre dissocié avec succès ! ✅', {
        description: `"${dissociatingCentre.centre.code} - ${dissociatingCentre.centre.nom}" a été dissocié du régisseur "${dissociatingCentre.regisseurNom}".`,
        duration: 3000,
      });

      setIsDissocierCentreDialogOpen(false);
      setDissociatingCentre(null);
      loadRegisseurs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la dissociation';
      toast.error('Erreur lors de la dissociation', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsDissociatingCentreLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingRegisseur) return;

    setIsDeleteLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.delete(`/admin/regisseurs/${deletingRegisseur.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Régisseur supprimé avec succès ! 🗑️', {
        description: `Le régisseur "${deletingRegisseur.prenom} ${deletingRegisseur.nom}" a été supprimé définitivement.`,
        duration: 4000,
      });

      setIsDeleteDialogOpen(false);
      setDeletingRegisseur(null);
      loadRegisseurs();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue lors de la suppression';
      
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
              <h1 className="text-5xl font-bold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-800 bg-clip-text text-transparent mb-2">
                Régisseurs
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Gestion des {isLoading ? '...' : regisseurs.length} régisseurs actifs
              </p>
            </div>
            {session?.user?.role === 'ADMIN' && (
              <Link href="/admin/regisseurs/create">
                <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un régisseur
                </Button>
              </Link>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <p className="text-slate-600 text-lg">Chargement...</p>
            </div>
          ) : regisseurs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-100 inline-block mb-4">
                <Users className="w-12 h-12 text-emerald-600" />
              </div>
              <p className="text-slate-600 text-lg mb-4">Aucun régisseur trouvé</p>
              {session?.user?.role === 'ADMIN' && (
                <Link href="/admin/regisseurs/create">
                  <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer le premier régisseur
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regisseurs.map((regisseur, index) => (
                <div
                  key={regisseur.id}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-slate-200 hover:border-emerald-300"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {/* Icône avec gradient */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors duration-300">
                        {regisseur.prenom} {regisseur.nom}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{regisseur.code}</p>
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
                          <DropdownMenuItem onClick={() => handleEdit(regisseur)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(regisseur)}
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
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{regisseur.region}</span>
                  </div>
                  {regisseur.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{regisseur.telephone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{regisseur.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span>{regisseur.centresCount || 0} centres supervisés</span>
                  </div>
                  {regisseur.usersCount > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{regisseur.usersCount} utilisateur(s) associé(s)</span>
                    </div>
                  )}
                  {regisseur.utilisateurs && regisseur.utilisateurs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Utilisateurs associés:</p>
                      {regisseur.utilisateurs.map((user: any) => (
                        <div key={user.id} className="bg-orange-50 dark:bg-orange-950/20 p-2 rounded text-xs border border-orange-200 dark:border-orange-800">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 font-medium text-orange-900 dark:text-orange-100">
                                <UserCircle className="h-3 w-3 flex-shrink-0" />
                                <span>{user.prenom} {user.nom} ({user.code || 'N/A'})</span>
                              </div>
                              <div className="flex items-center gap-2 ml-5 text-muted-foreground mt-1">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="text-xs">{user.email}</span>
                              </div>
                              <div className="ml-5 text-xs text-muted-foreground mt-1">
                                Rôle: {user.role}
                              </div>
                            </div>
                            {session?.user?.role === 'ADMIN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDissocierUtilisateur(user, `${regisseur.prenom} ${regisseur.nom}`)}
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                title="Dissocier cet utilisateur"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {regisseur.centres && regisseur.centres.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Centres supervisés:</p>
                      {regisseur.centres.map((centre: any) => (
                        <div key={centre.id} className="bg-muted/50 p-2 rounded text-xs space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 font-medium">
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                                <span>{centre.code} - {centre.nom}</span>
                              </div>
                              {centre.chefCentre && (
                                <div className="flex items-center gap-2 ml-5 text-muted-foreground mt-1">
                                  <UserCircle className="h-3 w-3 flex-shrink-0" />
                                  <span>Chef: {centre.chefCentre.prenom} {centre.chefCentre.nom} ({centre.chefCentre.code})</span>
                                </div>
                              )}
                            </div>
                            {session?.user?.role === 'ADMIN' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDissocierCentre(centre, `${regisseur.prenom} ${regisseur.nom}`)}
                                className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                                title="Dissocier ce centre"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                    {/* Footer avec actions */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        regisseur.actif 
                          ? 'bg-green-100 text-green-800 shadow-sm' 
                          : 'bg-red-100 text-red-800 shadow-sm'
                      }`}>
                        {regisseur.actif ? 'Actif' : 'Inactif'}
                      </span>
                      {session?.user?.role === 'ADMIN' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssocierChefs(regisseur)}
                            className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Associer des chefs de centres"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(regisseur)}
                            className="h-8 px-2"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(regisseur)}
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
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          )}

          {/* Modale de modification */}
          <EditRegisseurDialog
            regisseur={editingRegisseur}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={loadRegisseurs}
          />

          {/* Modale de suppression */}
          <DeleteRegisseurDialog
            regisseur={deletingRegisseur}
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            onConfirm={confirmDelete}
            isLoading={isDeleteLoading}
          />

          {/* Modale de dissociation */}
          <DissocierUserDialog
            user={dissociatingUser?.user || null}
            regisseurNom={dissociatingUser?.regisseurNom || ''}
            open={isDissocierDialogOpen}
            onOpenChange={setIsDissocierDialogOpen}
            onConfirm={confirmDissocier}
            isLoading={isDissociatingLoading}
          />

        {/* Modale d'association de chefs de centres */}
        <AssocierChefsDialog
          regisseurId={associatingRegisseur?.id || ''}
          regisseurNom={associatingRegisseur?.nom || ''}
          open={isAssocierDialogOpen}
          onOpenChange={setIsAssocierDialogOpen}
          onSuccess={loadRegisseurs}
        />

        {/* Modale de dissociation de centre */}
        <DissocierCentreDialog
          centre={dissociatingCentre?.centre || null}
          regisseurNom={dissociatingCentre?.regisseurNom || ''}
          open={isDissocierCentreDialogOpen}
          onOpenChange={setIsDissocierCentreDialogOpen}
          onConfirm={confirmDissocierCentre}
          isLoading={isDissociatingCentreLoading}
        />
        </div>
      </div>
    </DashboardLayout>
  );
}




