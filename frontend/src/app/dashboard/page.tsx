import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardAdmin from '@/components/dashboard/dashboard-admin';
import DashboardRegisseur from '@/components/dashboard/dashboard-regisseur';
import DashboardChef from '@/components/dashboard/dashboard-chef';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  // Redirection par rôle
  switch (session.user.role) {
    case 'ADMIN':
      return <DashboardAdmin />;
    case 'REGISSEUR':
      return <DashboardRegisseur />;
    case 'CHEF_CENTRE':
      return <DashboardChef />;
    default:
      redirect('/login');
  }
}

