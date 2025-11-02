'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { Lock, CheckCircle2, Clock, Building2, Mail, User, Key, Copy, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PasswordResetRequest {
  id: string;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
    code: string;
    role: 'ADMIN' | 'REGISSEUR' | 'CHEF_CENTRE';
    centre: {
      id: string;
      code: string;
      nom: string;
    } | null;
    regisseur: {
      id: string;
      code: string;
      nom: string;
      prenom: string;
      region: string;
    } | null;
  };
  statut: 'EN_ATTENTE' | 'TRAITE' | 'ANNULE';
  nouveauMotDePasse?: string;
  traitePar?: string;
  traiteLe?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PasswordResetRequestsPage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<PasswordResetRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (session) {
      loadRequests();
    }
  }, [session]);

  // Rafraîchir automatiquement toutes les 5 secondes s'il y a des demandes en attente
  useEffect(() => {
    if (!session || isLoading) return;

    const pendingCount = requests.filter((r) => r.statut === 'EN_ATTENTE').length;
    
    // Si there are pending requests, set up polling
    if (pendingCount > 0) {
      const interval = setInterval(async () => {
        try {
          const token = (session as any)?.accessToken;
          const response = await apiClient.get('/admin/password-reset-requests', {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          setRequests(response.data || []);
        } catch (error) {
          console.error('Erreur lors du rafraîchissement:', error);
        }
      }, 5000); // Rafraîchir toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [session, isLoading]); // Utiliser isLoading au lieu de requests pour éviter les re-renders infinis

  const loadRequests = async () => {
    try {
      const token = (session as any)?.accessToken;
      const response = await apiClient.get('/admin/password-reset-requests', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setRequests(response.data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des demandes:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = async (requestId: string) => {
    setIsGenerating(requestId);
    try {
      const token = (session as any)?.accessToken;
      const response = await apiClient.post(
        `/admin/password-reset-requests/${requestId}/generate-password`,
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success('Mot de passe généré avec succès !', {
        description: `Le nouveau mot de passe pour ${response.data.request.user.email} est : ${response.data.request.nouveauMotDePasse}`,
        duration: 10000,
      });

      // Afficher le dialogue avec le mot de passe
      setSelectedRequest(response.data.request);
      setIsDialogOpen(true);

      // Recharger les demandes
      await loadRequests();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Une erreur est survenue';
      toast.error('Erreur lors de la génération du mot de passe', {
        description: message,
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Mot de passe copié dans le presse-papier');
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'EN_ATTENTE':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        );
      case 'TRAITE':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Traité
          </Badge>
        );
      case 'ANNULE':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            Annulé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const pendingRequests = requests.filter((r) => r.statut === 'EN_ATTENTE');
  const processedRequests = requests.filter((r) => r.statut !== 'EN_ATTENTE');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Lock className="w-8 h-8" />
            Demandes de réinitialisation de mot de passe
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les demandes de réinitialisation de mot de passe des chefs de centre et des régisseurs
          </p>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-muted-foreground">Chargement des demandes...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Demandes en attente */}
            {pendingRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    Demandes en attente ({pendingRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {request.user.prenom} {request.user.nom}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({request.user.code})
                              </span>
                              {getStatusBadge(request.statut)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {request.user.email}
                            </div>
                            {request.user.role === 'CHEF_CENTRE' && request.user.centre && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                                Centre: {request.user.centre.code} - {request.user.centre.nom}
                              </div>
                            )}
                            {request.user.role === 'REGISSEUR' && request.user.regisseur && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4 text-blue-600" />
                                Régisseur: {request.user.regisseur.code} - {request.user.regisseur.region}
                              </div>
                            )}
                            {request.user.role && (
                              <Badge variant="outline" className={`text-xs ${
                                request.user.role === 'CHEF_CENTRE' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                                  : request.user.role === 'REGISSEUR'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : ''
                              }`}>
                                {request.user.role === 'CHEF_CENTRE' ? 'Chef de Centre' : request.user.role === 'REGISSEUR' ? 'Régisseur' : request.user.role}
                              </Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Demandé le{' '}
                              {new Date(request.createdAt).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleGeneratePassword(request.id)}
                            disabled={isGenerating === request.id}
                            className="ml-4"
                          >
                            {isGenerating === request.id ? (
                              <>
                                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Génération...
                              </>
                            ) : (
                              <>
                                <Key className="w-4 h-4 mr-2" />
                                Générer un mot de passe
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Demandes traitées */}
            {processedRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Demandes traitées ({processedRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processedRequests.map((request) => (
                      <div
                        key={request.id}
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {request.user.prenom} {request.user.nom}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({request.user.code})
                              </span>
                              {getStatusBadge(request.statut)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {request.user.email}
                            </div>
                            {request.user.role === 'CHEF_CENTRE' && request.user.centre && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                                Centre: {request.user.centre.code} - {request.user.centre.nom}
                              </div>
                            )}
                            {request.user.role === 'REGISSEUR' && request.user.regisseur && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Shield className="w-4 h-4 text-blue-600" />
                                Régisseur: {request.user.regisseur.code} - {request.user.regisseur.region}
                              </div>
                            )}
                            {request.user.role && (
                              <Badge variant="outline" className={`text-xs ${
                                request.user.role === 'CHEF_CENTRE' 
                                  ? 'bg-purple-50 text-purple-700 border-purple-300'
                                  : request.user.role === 'REGISSEUR'
                                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                                  : ''
                              }`}>
                                {request.user.role === 'CHEF_CENTRE' ? 'Chef de Centre' : request.user.role === 'REGISSEUR' ? 'Régisseur' : request.user.role}
                              </Badge>
                            )}
                            {request.nouveauMotDePasse && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm font-medium">Nouveau mot de passe :</span>
                                <code className="bg-slate-100 px-2 py-1 rounded text-sm font-mono">
                                  {request.nouveauMotDePasse}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(request.nouveauMotDePasse || '')}
                                  className="h-7 px-2"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {request.statut === 'TRAITE' && request.traiteLe && (
                                <>Traité le{' '}
                                  {new Date(request.traiteLe).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </>
                              )}
                              {request.statut !== 'TRAITE' && (
                                <>Demandé le{' '}
                                  {new Date(request.createdAt).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short',
                                  })}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {requests.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune demande de réinitialisation</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Dialog pour afficher le mot de passe généré */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Mot de passe généré avec succès
              </DialogTitle>
              <DialogDescription>
                Le nouveau mot de passe a été généré et appliqué pour cet utilisateur.
              </DialogDescription>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Utilisateur :</p>
                  <p className="font-semibold">
                    {selectedRequest.user.prenom} {selectedRequest.user.nom}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedRequest.user.email}</p>
                </div>
                {selectedRequest.nouveauMotDePasse && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Nouveau mot de passe :</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-100 px-4 py-3 rounded text-lg font-mono text-center">
                        {selectedRequest.nouveauMotDePasse}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          copyToClipboard(selectedRequest?.nouveauMotDePasse || '')
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Partagez ce mot de passe avec l&apos;utilisateur de manière sécurisée.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setIsDialogOpen(false)}>Fermer</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

