'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp, ArrowRight, Activity, Zap, Shield, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session && status !== 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-slate-600">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Menu rapide selon le rôle
  const quickActions = [
    {
      title: 'Dashboard',
      description: 'Vue d\'ensemble complète',
      icon: Activity,
      href: '/dashboard',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
    },
    {
      title: 'Centres de Santé',
      description: 'Gérer les centres',
      icon: Building2,
      href: '/centres',
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    },
    {
      title: 'Régisseurs',
      description: 'Gérer les régisseurs',
      icon: Users,
      href: '/regisseurs',
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
    },
  ];

  // Actions spécifiques selon le rôle
  const roleSpecificActions: Record<string, any[]> = {
    ADMIN: [
      { title: 'Chefs de Centres', description: 'Gérer les chefs', icon: UserCircle, href: '/admin/chefs-centres', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 hover:bg-purple-100' },
      { title: 'Budget', description: 'Budgets consolidés', icon: TrendingUp, href: '/budget', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100' },
      { title: 'NBE', description: 'Nomenclature budgétaire', icon: FileText, href: '/nbe', color: 'from-orange-500 to-orange-600', bgColor: 'bg-orange-50 hover:bg-orange-100' },
    ],
    REGISSEUR: [
      { title: 'Mes Centres', description: 'Centres supervisés', icon: Building2, href: '/centres', color: 'from-blue-500 to-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100' },
      { title: 'Valider OP', description: 'Ordres de paiement', icon: FileText, href: '/op', color: 'from-green-500 to-green-600', bgColor: 'bg-green-50 hover:bg-green-100' },
    ],
    CHEF_CENTRE: [
      { title: 'Mon Budget', description: 'Créer un PAA', icon: TrendingUp, href: '/budget', color: 'from-purple-500 to-purple-600', bgColor: 'bg-purple-50 hover:bg-purple-100' },
      { title: 'Créer OP', description: 'Nouvel ordre de paiement', icon: FileText, href: '/op/create', color: 'from-indigo-500 to-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100' },
    ],
  };

  const userActions = roleSpecificActions[session.user.role] || [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-8 py-12">
          {/* Header de bienvenue */}
          <div className="mb-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-6">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-4">
              Bienvenue dans CGCS
            </h1>
            <p className="text-xl text-slate-600 font-medium">
              Comptabilité de Gestion des Centres de Santé
            </p>
            <p className="text-lg text-slate-500 mt-2">
              Bon retour, <span className="font-semibold text-slate-700">{session.user.name}</span>
            </p>
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600" />
              Actions rapides
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.title} href={action.href}>
                    <Card className={`${action.bgColor} border-2 border-transparent hover:border-${action.color.split(' ')[0]}-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl cursor-pointer`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold text-slate-800">{action.title}</CardTitle>
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-blue-700">
                          <span>Accéder</span>
                          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Actions spécifiques au rôle */}
          {userActions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <UserCircle className="w-6 h-6 text-purple-600" />
                Vos outils {session.user.role === 'ADMIN' ? "d'administration" : session.user.role === 'REGISSEUR' ? 'de régisseur' : 'de chef de centre'}
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {userActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.title} href={action.href}>
                      <Card className={`${action.bgColor} border-2 border-transparent hover:border-${action.color.split(' ')[0]}-300 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl cursor-pointer`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-semibold text-slate-800">{action.title}</CardTitle>
                            <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 mb-4">{action.description}</p>
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-700 group-hover:text-purple-700">
                            <span>Accéder</span>
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Statistiques rapides (si admin) */}
          {session.user.role === 'ADMIN' && (
            <div className="mt-12">
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-slate-800">Bien démarrer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">Commencez par créer vos centres de santé</p>
                      <Link href="/admin/centres/create">
                        <Button className="mt-3 w-full" variant="outline">
                          Créer un centre
                        </Button>
                      </Link>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">Ajoutez vos régisseurs</p>
                      <Link href="/admin/regisseurs/create">
                        <Button className="mt-3 w-full" variant="outline">
                          Créer un régisseur
                        </Button>
                      </Link>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <UserCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-slate-700">Assignez des chefs de centres</p>
                      <Link href="/admin/chefs-centres/create">
                        <Button className="mt-3 w-full" variant="outline">
                          Créer un chef
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

