'use client';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import BudgetList from '@/components/budget/budget-list';
import { useEffect } from 'react';

export default function BudgetPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers login seulement si la session est vraiment non disponible
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Afficher un loader pendant le chargement de la session
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Si pas de session après chargement, ne rien afficher (la redirection est en cours)
  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Plan d'Action Annuel (Budget)</h1>
          <p className="text-slate-600 mt-2">
            Création et gestion des budgets annuels par centre
          </p>
        </div>

        <BudgetList />
      </div>
    </DashboardLayout>
  );
}