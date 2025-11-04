import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NBETable from '@/components/nbe/nbe-table';

export default async function NBEPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Nomenclature du Budget de l'État (NBE)</h1>
          <p className="text-slate-600 mt-2">
            Classification budgétaire officielle pour les centres de santé
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">
              📊 Nomenclature Budgétaire de l'État
            </h2>
            <p className="text-slate-600 text-sm">
              Cette nomenclature définit la classification officielle des dépenses budgétaires 
              pour les centres de santé selon les normes de l'État.
            </p>
          </div>

          <NBETable />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Lignes Budgétaires</h3>
            <p className="text-blue-600 text-sm mb-3">
              Codes de classification officiels selon la nomenclature de l'État
            </p>
            <div className="text-2xl font-bold text-blue-700">50+ lignes</div>
          </div>

          <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
            <h3 className="text-lg font-semibold text-emerald-800 mb-2">🏗️ Immobilisations</h3>
            <p className="text-emerald-600 text-sm mb-3">
              Acquisitions, constructions et grosses réparations
            </p>
            <div className="text-2xl font-bold text-emerald-700">15 catégories</div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">⚙️ Fonctionnement</h3>
            <p className="text-purple-600 text-sm mb-3">
              Dépenses courantes et équipements de fonctionnement
            </p>
            <div className="text-2xl font-bold text-purple-700">35 catégories</div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">ℹ️ Informations sur la NBE</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium text-slate-700 mb-2">📊 Structure des Codes</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <strong>2xxx :</strong> Immobilisations incorporelles</li>
                <li>• <strong>22xx :</strong> Acquisitions et aménagements des sols</li>
                <li>• <strong>23xx :</strong> Constructions et réparations d'immeubles</li>
                <li>• <strong>24xx :</strong> Matériel et mobilier</li>
                <li>• <strong>25xx :</strong> Matériel de transport</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-slate-700 mb-2">🎯 Utilisation</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>• <span className="text-blue-600">📋 Planification :</span> Élaboration des budgets</li>
                <li>• <span className="text-green-600">💰 Exécution :</span> Imputation des dépenses</li>
                <li>• <span className="text-purple-600">📊 Suivi :</span> Contrôle et reporting</li>
                <li>• <span className="text-orange-600">🔍 Audit :</span> Vérification de conformité</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}









