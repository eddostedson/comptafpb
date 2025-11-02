'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserPlus, MapPin, Phone, Mail, Building2, Plus, Pencil, Trash2, MoreVertical, Shield } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from 'sonner';
import { EditChefDialog } from '@/components/chefs-centres/edit-chef-dialog';
import { DeleteChefDialog } from '@/components/chefs-centres/delete-chef-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ChefsCentresPage() {
  const { data: session } = useSession();
  const [chefs, setChefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingChef, setEditingChef] = useState<any | null>(null);
  const [deletingChef, setDeletingChef] = useState<any | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const loadChefs = async () => {
    try {
      const token = (session as any)?.accessToken;
      const response = await apiClient.get('/admin/chefs-centres', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setChefs(response.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des chefs de centres:', error);
      toast.error('Erreur lors du chargement des chefs de centres');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadChefs();
    }
  }, [session]);

  const handleEdit = (chef: any) => {
    setEditingChef(chef);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (chef: any) => {
    setDeletingChef(chef);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingChef) return;

    setIsDeleteLoading(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.delete(`/admin/chefs-centres/${deletingChef.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Chef de centre supprimé avec succès ! 🗑️', {
        description: `Le chef "${deletingChef.prenom} ${deletingChef.nom}" a été supprimé définitivement.`,
        duration: 4000,
      });

      setIsDeleteDialogOpen(false);
      setDeletingChef(null);
      loadChefs();
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
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 bg-clip-text text-transparent mb-2">
                Chefs de Centres
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Gestion des {isLoading ? '...' : chefs.length} chefs de centres actifs
              </p>
            </div>
            <Link href="/admin/chefs-centres/create">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <Plus className="w-4 h-4 mr-2" />
                Créer un chef de centre
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <p className="text-slate-600 text-lg">Chargement...</p>
            </div>
          ) : chefs.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-xl border border-slate-200 text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-pink-100 inline-block mb-4">
                <UserPlus className="w-12 h-12 text-purple-600" />
              </div>
              <p className="text-slate-600 text-lg mb-4">Aucun chef de centre trouvé</p>
              <Link href="/admin/chefs-centres/create">
                <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer le premier chef de centre
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {chefs.map((chef, index) => (
                <div
                  key={chef.id}
                  className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-slate-200 hover:border-purple-300"
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  {/* Icône avec gradient */}
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="inline-flex p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 ml-4">
                      <h3 className="text-xl font-bold text-slate-800 group-hover:text-purple-700 transition-colors duration-300">
                        {chef.prenom} {chef.nom}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">{chef.code || 'Sans code'}</p>
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
                          <DropdownMenuItem onClick={() => handleEdit(chef)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(chef)}
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
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{chef.email}</span>
                  </div>
                  {chef.telephone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{chef.telephone}</span>
                    </div>
                  )}
                  {chef.centre && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">Centre: {chef.centre.code} - {chef.centre.nom}</span>
                    </div>
                  )}
                  {(chef.regisseur || chef.centre?.regisseur) && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <Shield className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">
                        Régisseur: {(chef.regisseur || chef.centre?.regisseur)?.code} - {(chef.regisseur || chef.centre?.regisseur)?.prenom} {(chef.regisseur || chef.centre?.regisseur)?.nom}
                      </span>
                    </div>
                  )}
                    {/* Footer avec actions */}
                    <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                      {session?.user?.role === 'ADMIN' && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(chef)}
                            className="h-8 px-2"
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(chef)}
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
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                </div>
              ))}
            </div>
          )}

          {/* Modale de modification */}
          <EditChefDialog
            chef={editingChef}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={loadChefs}
          />

          {/* Modale de suppression */}
          <DeleteChefDialog
            chef={deletingChef}
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

