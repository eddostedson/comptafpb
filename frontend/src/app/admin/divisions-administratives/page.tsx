'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Plus, Pencil, Trash2, Search, Download, Upload, Building2 } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CreateDivisionDialog } from '@/components/divisions-administratives/create-division-dialog';
import { EditDivisionDialog } from '@/components/divisions-administratives/edit-division-dialog';
import { DeleteDivisionDialog } from '@/components/divisions-administratives/delete-division-dialog';

export default function DivisionsAdministrativesPage() {
  const { data: session } = useSession();
  const [divisions, setDivisions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // États pour les dialogues
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDivisions = async (search?: string, pageNum = 1) => {
    try {
      setIsLoading(true);
      const token = (session as any)?.accessToken;
      const params = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: '50',
      });
      if (search) {
        params.append('search', search);
      }

      const response = await apiClient.get(`/divisions-administratives?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      setDivisions(response.data.items || []);
      setTotal(response.data.total || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (error: any) {
      console.error('Erreur lors du chargement des divisions administratives:', error);
      if (error.response?.status === 404) {
        // Table pas encore créée
        toast.info('La table des divisions administratives n\'existe pas encore. Veuillez d\'abord créer la migration.');
      } else {
        toast.error('Erreur lors du chargement des divisions administratives');
      }
      setDivisions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce pour la recherche automatique
  useEffect(() => {
    if (session) {
      const timeoutId = setTimeout(() => {
        setPage(1);
        loadDivisions(searchTerm, 1);
      }, 500); // Attendre 500ms après la dernière frappe

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchTerm]);

  useEffect(() => {
    if (session) {
      loadDivisions(searchTerm, page);
    }
  }, [session, page]);

  const handleSearch = () => {
    setPage(1);
    loadDivisions(searchTerm, 1);
  };

  const handleCreate = () => {
    setSelectedDivision(null);
    setCreateDialogOpen(true);
  };

  const handleEdit = (division: any) => {
    setSelectedDivision(division);
    setEditDialogOpen(true);
  };

  const handleDelete = (division: any) => {
    setSelectedDivision(division);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDivision) return;

    setIsDeleting(true);
    try {
      const token = (session as any)?.accessToken;
      await apiClient.delete(`/divisions-administratives/${selectedDivision.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      toast.success('Division administrative supprimée avec succès ! 🎉', {
        description: `La division "${selectedDivision.region || selectedDivision.commune || 'sélectionnée'}" a été supprimée.`,
        duration: 3000,
      });

      setDeleteDialogOpen(false);
      setSelectedDivision(null);
      loadDivisions(searchTerm, page);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error('Erreur lors de la suppression', {
        description: message,
        duration: 4000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSuccess = () => {
    loadDivisions(searchTerm, page);
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header moderne */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent mb-2">
                Divisions Administratives
              </h1>
              <p className="text-xl text-slate-600 font-medium">
                Gestion du référentiel administratif (régions, départements, communes)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreate}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle division
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  toast.info('Fonctionnalité d\'import Excel à venir');
                }}
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer Excel
              </Button>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Rechercher par région, département, commune..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="default">
              Rechercher
            </Button>
            {searchTerm && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  handleSearch();
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total divisions</p>
                  <p className="text-2xl font-bold text-slate-800">{total}</p>
                </div>
                <MapPin className="w-8 h-8 text-indigo-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Affichées</p>
                  <p className="text-2xl font-bold text-slate-800">{divisions.length}</p>
                </div>
                <Building2 className="w-8 h-8 text-purple-500" />
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Page</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {page}/{totalPages}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-lg border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">État</p>
                  {isLoading ? (
                    <Badge variant="outline" className="mt-1">
                      Chargement...
                    </Badge>
                  ) : divisions.length > 0 ? (
                    <Badge className="bg-green-100 text-green-800 mt-1">
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="mt-1">
                      Vide
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des divisions */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
              <p className="text-slate-600">Chargement des divisions administratives...</p>
            </div>
          ) : divisions.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <MapPin className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Aucune division administrative trouvée
              </h3>
              <p className="text-slate-600 mb-6">
                {searchTerm
                  ? 'Aucun résultat pour votre recherche. Essayez avec d\'autres termes.'
                  : 'La table des divisions administratives est vide. Importez les données depuis Excel pour commencer.'}
              </p>
              {!searchTerm && (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    onClick={() => {
                      toast.info('Pour importer les données, exécutez: pnpm admin:import-villes');
                    }}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Voir instructions d'import
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          Région
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          Département
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          Chef-lieu
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          Sous-préfecture
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          Commune
                        </th>
                        <th className="text-left py-4 px-6 text-sm font-semibold text-slate-700">
                          État
                        </th>
                        <th className="text-right py-4 px-6 text-sm font-semibold text-slate-700">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {divisions.map((division, index) => (
                        <tr
                          key={division.id}
                          className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                          }`}
                        >
                          <td className="py-4 px-6">
                            <span className="font-semibold text-slate-800">
                              {division.region || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-700">{division.departement || '-'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-700">{division.chefLieu || '-'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-700">
                              {division.sousPrefecture || '-'}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-slate-700">{division.commune || '-'}</span>
                          </td>
                          <td className="py-4 px-6">
                            {division.actif ? (
                              <Badge className="bg-green-100 text-green-800">Actif</Badge>
                            ) : (
                              <Badge variant="outline">Inactif</Badge>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(division)}
                                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(division)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    <div className="text-sm text-slate-600">
                      Page {page} sur {totalPages} • {total} divisions au total
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialogues */}
      <CreateDivisionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />
      <EditDivisionDialog
        division={selectedDivision}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={handleSuccess}
      />
      <DeleteDivisionDialog
        division={selectedDivision}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  );
}

