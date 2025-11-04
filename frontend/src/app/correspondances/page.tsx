import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CorrespondancesTable from '@/components/correspondances/correspondances-table';

export default async function CorrespondancesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Correspondances des Activités</h1>
          <p className="text-slate-600 mt-2">
            Tableau de correspondance des activités aux lignes budgétaires
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              📊 Correspondances d'Activités aux Lignes Budgétaires
            </h2>
            <p className="text-slate-600 text-sm">
              Ce tableau montre comment chaque activité médicale est associée aux lignes budgétaires 
              avec les pourcentages d'allocation et les montants maximums.
            </p>
          </div>

          <CorrespondancesTable />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Lignes Budgétaires</h3>
            <p className="text-blue-600 text-sm mb-3">
              Classification comptable standardisée avec codes chapitre/section/paragraphe/article
            </p>
            <div className="text-2xl font-bold text-blue-700">7 lignes</div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">🏥 Activités Médicales</h3>
            <p className="text-emerald-600 text-sm mb-3">
              Activités de soins et services médicaux avec codes d'identification uniques
            </p>
            <div className="text-2xl font-bold text-emerald-700">7 activités</div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🔗 Correspondances</h3>
            <p className="text-purple-600 text-sm mb-3">
              Associations avec pourcentages d'allocation et montants maximums par activité
            </p>
            <div className="text-2xl font-bold text-purple-700">7 correspondances</div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">ℹ️ Informations sur les Correspondances</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-slate-700 mb-2">📊 Structure des Codes</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>Chapitre :</strong> 01 (Personnel), 02 (Fonctionnement), 03 (Investissement)</li>
                <li>• <strong>Section :</strong> 01 (Salaires), 02 (Achats), 03 (Formation)</li>
                <li>• <strong>Paragraphe :</strong> 01 (Médical), 02 (Infirmier), 03 (Administratif)</li>
                <li>• <strong>Article :</strong> 01 (Consultations), 02 (Soins), 03 (Chirurgie)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-2">🎯 Priorités</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <span className="text-red-600">🔴 Haute (1) :</span> Soins critiques, urgences</li>
                <li>• <span className="text-yellow-600">🟡 Moyenne (2) :</span> Prévention, formation</li>
                <li>• <span className="text-green-600">🟢 Faible (3) :</span> Maintenance, administration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}






