import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BudgetForm from '@/components/budget/budget-form';

export default async function CreateBudgetPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Nouveau Plan d'Action Annuel</h1>
          <p className="text-slate-600 mt-2">
            Créer un nouveau budget annuel pour votre centre
          </p>
        </div>

        <BudgetForm />
      </div>
    </DashboardLayout>
  );
}



