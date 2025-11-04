'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Building2, Users, FileText, TrendingUp, ArrowRight, Activity, Zap, Shield, Link2, UserCircle, Wifi, WifiOff, Search, Monitor, Globe, Home, Clock, Lock } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function DashboardAdminTest() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    centres: 0,
    regisseurs: 0,
    chefsCentres: 0,
    opEnAttente: 0,
    budgetTotal: '0 FCFA',
  });
  const [relationships, setRelationships] = useState<{
    centres: any[];
    regisseurs: any[];
    chefsCentres: any[];
  }>({
    centres: [],
    regisseurs: [],
    chefsCentres: [],
  });
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = (session as any)?.accessToken;
        console.log('[Dashboard] Session:', session ? 'présente' : 'absente');
        console.log('[Dashboard] Token:', token ? 'présent' : 'absent');
        
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        console.log('[Dashboard] Chargement des centres...');

        // Charger les centres
        const centresRes = await apiClient.get('/admin/centres', { headers });
        console.log('[Dashboard] Réponse centres:', centresRes.data);
        const centresCount = Array.isArray(centresRes.data) ? centresRes.data.length : 0;
        console.log('[Dashboard] Nombre de centres:', centresCount);

        // Charger les régisseurs
        console.log('[Dashboard] Chargement des régisseurs...');
        const regisseursRes = await apiClient.get('/admin/regisseurs', { headers });
        console.log('[Dashboard] Réponse régisseurs:', regisseursRes.data);
        const regisseursCount = Array.isArray(regisseursRes.data) ? regisseursRes.data.length : 0;
        console.log('[Dashboard] Nombre de régisseurs:', regisseursCount);

        // Charger les chefs de centres
        console.log('[Dashboard] Chargement des chefs de centres...');
        const chefsRes = await apiClient.get('/admin/chefs-centres', { headers });
        console.log('[Dashboard] Réponse chefs:', chefsRes.data);
        const chefsCount = Array.isArray(chefsRes.data) ? chefsRes.data.length : 0;
        console.log('[Dashboard] Nombre de chefs de centres:', chefsCount);

        setStats({
          centres: centresCount,
          regisseurs: regisseursCount,
          chefsCentres: chefsCount,
          opEnAttente: 0, // TODO: charger depuis l'API OP quand disponible
          budgetTotal: '0 FCFA', // TODO: charger depuis l'API Budget quand disponible
        });

        // Sauvegarder les données pour afficher les relations
        setRelationships({
          centres: Array.isArray(centresRes.data) ? centresRes.data : [],
          regisseurs: Array.isArray(regisseursRes.data) ? regisseursRes.data : [],
          chefsCentres: Array.isArray(chefsRes.data) ? chefsRes.data : [],
        });
        
        // Charger les utilisateurs connectés
        await loadConnectedUsers(headers);
        
        console.log('[Dashboard] Statistiques mises à jour:', {
          centres: centresCount,
          regisseurs: regisseursCount,
        });
      } catch (error: any) {
        console.error('[Dashboard] Erreur lors du chargement des statistiques:', error);
        console.error('[Dashboard] Détails:', error.response?.data || error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const loadConnectedUsers = async (headers: any) => {
      try {
        setIsLoadingUsers(true);
        const usersRes = await apiClient.get('/admin/users/connected', { headers });
        setConnectedUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (error: any) {
        console.error('[Dashboard] Erreur lors du chargement des utilisateurs connectés:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (session) {
      loadStats();
      // Charger les utilisateurs connectés immédiatement puis toutes les 30 secondes
      const token = (session as any)?.accessToken;
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      loadConnectedUsers(headers);
      
      const interval = setInterval(() => {
        loadConnectedUsers(headers);
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      console.log('[Dashboard] Pas de session, statistiques non chargées');
      setIsLoading(false);
    }
  }, [session]);

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const statsData = [
    {
      title: 'Centres de Santé',
      value: isLoading ? '...' : stats.centres.toLocaleString('fr-FR'),
      description: 'Centres actifs',
      icon: Building2,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      textColor: 'text-blue-600',
      valueColor: 'text-blue-700',
      hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
      href: '/centres'
    },
    {
      title: 'Régisseurs',
      value: isLoading ? '...' : stats.regisseurs.toLocaleString('fr-FR'),
      description: 'Régisseurs actifs',
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      textColor: 'text-emerald-600',
      valueColor: 'text-emerald-700',
      hoverGradient: 'hover:from-emerald-600 hover:to-emerald-700',
      href: '/regisseurs'
    },
    {
      title: 'Chefs de Centres',
      value: isLoading ? '...' : stats.chefsCentres.toLocaleString('fr-FR'),
      description: 'Chefs actifs',
      icon: UserCircle,
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-100',
      textColor: 'text-purple-600',
      valueColor: 'text-purple-700',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-700',
      href: '/admin/chefs-centres'
    },
    {
      title: 'Budget total',
      value: isLoading ? '...' : stats.budgetTotal,
      description: 'Budget consolidé',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100',
      textColor: 'text-amber-600',
      valueColor: 'text-amber-700',
      hoverGradient: 'hover:from-amber-600 hover:to-amber-700',
      href: '/budget'
    }
  ];

  const quickActions = [
    {
      title: 'Correspondances d\'Activités',
      description: 'Tableau de correspondance des activités aux lignes budgétaires',
      icon: Activity,
      gradient: 'from-indigo-500 to-indigo-600',
      bgGradient: 'from-indigo-50 to-indigo-100',
      textColor: 'text-indigo-600',
      href: '/correspondances'
    },
    {
      title: 'NBE - Nomenclature Budgétaire',
      description: 'Classification officielle des dépenses budgétaires de l\'État',
      icon: Building2,
      gradient: 'from-cyan-500 to-cyan-600',
      bgGradient: 'from-cyan-50 to-cyan-100',
      textColor: 'text-cyan-600',
      href: '/nbe'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        {/* Barre de statut en haut - FIXE */}
        <div className="sticky top-16 z-30 mb-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200 p-4 mt-8">
          <div className="flex items-center justify-between gap-4">
            {/* Titre et bouton */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800">Statut des utilisateurs</h2>
                <p className="text-xs text-slate-500">Vue en temps réel</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Statut de l'utilisateur connecté - GAUCHE */}
              <div className="flex items-center gap-3 p-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-lg">
                  {session?.user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{session?.user?.name || 'Utilisateur'}</p>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 text-xs flex-shrink-0">
                    {session?.user?.role === 'ADMIN' ? 'Admin' : session?.user?.role || 'User'}
                  </Badge>
                  <Wifi className="w-3 h-3 text-green-500 flex-shrink-0" />
                </div>
              </div>

              {/* Séparateur */}
              <div className="w-px h-8 bg-slate-200 flex-shrink-0"></div>

              {/* Autres utilisateurs connectés - DROITE */}
              <div className="flex-1 min-w-0">
                {isLoadingUsers && connectedUsers.length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Chargement...</span>
                  </div>
                ) : connectedUsers.filter(u => u.id !== session?.user?.id).length === 0 ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    <span>Aucun autre utilisateur</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {connectedUsers
                      .filter(u => u.id !== session?.user?.id && u.statut === 'En ligne')
                      .slice(0, 5) // Limiter à 5 utilisateurs pour ne pas prendre trop de place
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex-shrink-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-[10px] shadow-md">
                            {user.nomUtilisateur.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">
                              {user.nomUtilisateur}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 ${
                                user.role === 'REGISSEUR'
                                  ? 'bg-green-100 text-green-800 border-green-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {user.role === 'REGISSEUR' ? 'Régisseur' : 'Chef'}
                            </Badge>
                          </div>
                          <Wifi className="w-3 h-3 text-green-500 flex-shrink-0" />
                        </div>
                      ))}
                    {connectedUsers.filter(u => u.id !== session?.user?.id && u.statut === 'En ligne').length > 5 && (
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600 flex-shrink-0">
                        +{connectedUsers.filter(u => u.id !== session?.user?.id && u.statut === 'En ligne').length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bouton retour */}
            <Link href="/home" className="flex-shrink-0">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Home className="w-4 h-4" />
                <span className="hidden md:inline">Accueil</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Header moderne */}
        <div className="mb-12 text-center px-8 pt-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
            Dashboard Admin
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            Vue d'ensemble nationale - CGCS
          </p>
          <div className="flex items-center justify-center mt-4 space-x-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-semibold">Système opérationnel</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
              <Monitor className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Frontend</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-blue-600">En ligne</span>
            </div>
          </div>
        </div>
        
        {/* Tuiles ultra modernes */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.title}
                onClick={() => handleNavigation(stat.href)}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border border-slate-200 hover:border-transparent"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Effet de brillance au survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Icône avec gradient */}
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${stat.gradient} shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Contenu */}
                <div className="relative z-10">
                  <h3 className={`text-lg font-bold ${stat.textColor} mb-2 group-hover:text-slate-800 transition-colors duration-300`}>
                    {stat.title}
                  </h3>
                  <p className={`text-4xl font-black ${stat.valueColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    {stat.value}
                  </p>
                  <p className="text-slate-500 text-sm font-medium mb-4">
                    {stat.description}
                  </p>
                  
                  {/* Bouton d'action */}
                  <div className="flex items-center text-slate-400 group-hover:text-slate-600 transition-colors duration-300">
                    <span className="text-sm font-semibold mr-2">Voir les détails</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </div>
                </div>
                
                {/* Bordure animée */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              </button>
            );
          })}
        </div>

          {/* Section d'actions rapides moderne */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 ml-4">Actions Rapides</h3>
              </div>
              <div className="space-y-4">
                <a href="/centres" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group">
                  <span className="font-semibold text-blue-700">Gérer les Centres</span>
                  <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <a href="/regisseurs" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 transition-all duration-300 group">
                  <span className="font-semibold text-emerald-700">Superviser les Régisseurs</span>
                  <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <a href="/admin/divisions-administratives" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group">
                  <span className="font-semibold text-purple-700">Divisions Administratives</span>
                  <ArrowRight className="w-4 h-4 text-purple-500 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <a href="/op" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 transition-all duration-300 group">
                  <span className="font-semibold text-amber-700">Valider les OP</span>
                  <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
                <a href="/admin/password-reset-requests" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 transition-all duration-300 group">
                  <span className="font-semibold text-red-700 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Réinitialiser les mots de passe
                  </span>
                  <ArrowRight className="w-4 h-4 text-red-500 group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </div>
            </div>

          {/* Carte des correspondances d'activités */}
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.title} className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300 group cursor-pointer" onClick={() => handleNavigation(action.href)}>
                <div className="flex items-center mb-6">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${action.gradient} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 ml-4">{action.title}</h3>
                </div>
                <p className="text-slate-600 mb-6">{action.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${action.textColor}`}>Voir le tableau</span>
                  <ArrowRight className={`w-4 h-4 ${action.textColor} group-hover:translate-x-1 transition-transform duration-300`} />
                </div>
              </div>
            );
          })}

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 ml-4">Sécurité</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Sessions actives</span>
                <span className="font-bold text-green-600">1</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Dernière connexion</span>
                <span className="font-bold text-slate-800">Maintenant</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Statut</span>
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-semibold">Sécurisé</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center mb-6">
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 ml-4">Performance</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Temps de réponse</span>
                <span className="font-bold text-green-600">&lt; 200ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Uptime</span>
                <span className="font-bold text-green-600">99.9%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Utilisateurs</span>
                <span className="font-bold text-blue-600">2,651</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Relations entre entités */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-slate-200">
          <div className="flex items-center mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
              <Link2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 ml-4">Relations entre Entités</h3>
          </div>
          <p className="text-slate-600 mb-6">Vue d'ensemble des liens entre les centres, régisseurs et chefs de centres</p>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Cartes Régisseurs avec leurs Centres */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center mb-4">
                <Users className="w-5 h-5 text-emerald-600 mr-2" />
                <h4 className="font-bold text-emerald-800">Régisseurs → Centres</h4>
              </div>
              {isLoading ? (
                <p className="text-sm text-slate-600">Chargement...</p>
              ) : (
                <div className="space-y-3">
                  {relationships.regisseurs.slice(0, 3).map((regisseur: any) => (
                    <div key={regisseur.id} className="bg-white rounded-lg p-3 border border-emerald-200">
                      <div className="font-semibold text-sm text-slate-800 mb-1">
                        {regisseur.code} - {regisseur.prenom} {regisseur.nom}
                      </div>
                      <div className="text-xs text-slate-600">
                        {regisseur.centresCount || 0} centre(s) supervisé(s)
                      </div>
                      {relationships.centres
                        .filter((c: any) => c.regisseurId === regisseur.id)
                        .slice(0, 2)
                        .map((centre: any) => (
                          <div key={centre.id} className="text-xs text-emerald-700 mt-1 ml-2 flex items-center">
                            <Building2 className="w-3 h-3 mr-1" />
                            {centre.code} - {centre.nom}
                          </div>
                        ))}
                    </div>
                  ))}
                  {relationships.regisseurs.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Aucun régisseur trouvé</p>
                  )}
                </div>
              )}
            </div>

            {/* Cartes Centres avec leurs Régisseurs */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 text-blue-600 mr-2" />
                <h4 className="font-bold text-blue-800">Centres → Régisseurs</h4>
              </div>
              {isLoading ? (
                <p className="text-sm text-slate-600">Chargement...</p>
              ) : (
                <div className="space-y-3">
                  {relationships.centres.slice(0, 3).map((centre: any) => (
                    <div key={centre.id} className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="font-semibold text-sm text-slate-800 mb-1">
                        {centre.code} - {centre.nom}
                      </div>
                      {centre.regisseur ? (
                        <div className="text-xs text-blue-700 mt-1 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Régisseur: {centre.regisseur.code} - {centre.regisseur.prenom} {centre.regisseur.nom}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic mt-1">Aucun régisseur assigné</div>
                      )}
                      {relationships.chefsCentres
                        .filter((c: any) => c.centreId === centre.id)
                        .length > 0 && (
                        <div className="text-xs text-slate-600 mt-1">
                          {relationships.chefsCentres.filter((c: any) => c.centreId === centre.id).length} chef(s) de centre
                        </div>
                      )}
                    </div>
                  ))}
                  {relationships.centres.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Aucun centre trouvé</p>
                  )}
                </div>
              )}
            </div>

            {/* Cartes Chefs de Centres avec leurs Centres */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-4">
                <UserCircle className="w-5 h-5 text-purple-600 mr-2" />
                <h4 className="font-bold text-purple-800">Chefs de Centres → Centres</h4>
              </div>
              {isLoading ? (
                <p className="text-sm text-slate-600">Chargement...</p>
              ) : (
                <div className="space-y-3">
                  {relationships.chefsCentres.slice(0, 3).map((chef: any) => (
                    <div key={chef.id} className="bg-white rounded-lg p-3 border border-purple-200">
                      <div className="font-semibold text-sm text-slate-800 mb-1">
                        {chef.code} - {chef.prenom} {chef.nom}
                      </div>
                      {chef.centre ? (
                        <div className="text-xs text-purple-700 mt-1 flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          Centre: {chef.centre.code} - {chef.centre.nom}
                        </div>
                      ) : (
                        <div className="text-xs text-slate-500 italic mt-1">Aucun centre assigné</div>
                      )}
                      {chef.regisseur && (
                        <div className="text-xs text-slate-600 mt-1 flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          Régisseur: {chef.regisseur.code}
                        </div>
                      )}
                    </div>
                  ))}
                  {relationships.chefsCentres.length === 0 && (
                    <p className="text-sm text-slate-500 italic">Aucun chef de centre trouvé</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Statistiques des relations */}
          <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {relationships.regisseurs.filter((r: any) => (r.centresCount || 0) > 0).length}
              </div>
              <div className="text-sm text-slate-600">Régisseurs actifs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {relationships.centres.filter((c: any) => c.regisseurId).length}
              </div>
              <div className="text-sm text-slate-600">Centres avec régisseur</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {relationships.chefsCentres.filter((c: any) => c.centreId).length}
              </div>
              <div className="text-sm text-slate-600">Chefs assignés</div>
            </div>
          </div>
        </div>

        {/* Footer moderne */}
        <div className="text-center">
          <p className="text-slate-500 text-lg">
            Système de gestion comptable pour <span className="font-bold text-slate-700">{stats.centres} centre{stats.centres > 1 ? 's' : ''} de santé</span>
          </p>
          <div className="flex items-center justify-center mt-4 space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Système en ligne</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">Données synchronisées</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-600">IA activée</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
