'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import BudgetForm from '@/components/budget/budget-form';

export default function CreateBudgetPage() {
  const searchParams = useSearchParams();
  const budgetId = searchParams.get('budgetId') || undefined;

  useEffect(() => {
    console.log('CreateBudgetPage - budgetId depuis URL:', budgetId);
  }, [budgetId]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Nouveau Plan d'Action Annuel</h1>
          <p className="text-slate-600 mt-2">
            Créer un nouveau budget annuel pour votre centre
          </p>
        </div>

        <BudgetForm key={budgetId || 'new'} budgetId={budgetId} />
      </div>
    </DashboardLayout>
  );
}



