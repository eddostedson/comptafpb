'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, FileText, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

export default function TestLinksPage() {
  const { data: session } = useSession();

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Test des Liens</h1>
          <p className="text-muted-foreground">
            Page de test pour vérifier la navigation
          </p>
        </div>

        {/* Test avec window.location.href */}
        <Card>
          <CardHeader>
            <CardTitle>Test avec window.location.href</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <button
                onClick={() => handleNavigation('/centres')}
                className="p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Building2 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold">Centres</h3>
                <p className="text-sm text-gray-600">Cliquez pour tester</p>
              </button>

              <button
                onClick={() => handleNavigation('/regisseurs')}
                className="p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-colors"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold">Régisseurs</h3>
                <p className="text-sm text-gray-600">Cliquez pour tester</p>
              </button>

              <button
                onClick={() => handleNavigation('/op')}
                className="p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 transition-colors"
              >
                <FileText className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <h3 className="font-semibold">OP</h3>
                <p className="text-sm text-gray-600">Cliquez pour tester</p>
              </button>

              <button
                onClick={() => handleNavigation('/budget')}
                className="p-4 border-2 border-purple-500 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                <h3 className="font-semibold">Budget</h3>
                <p className="text-sm text-gray-600">Cliquez pour tester</p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Test avec liens directs */}
        <Card>
          <CardHeader>
            <CardTitle>Test avec liens directs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><a href="/centres" className="text-blue-500 hover:underline">→ Aller aux Centres</a></p>
              <p><a href="/regisseurs" className="text-green-500 hover:underline">→ Aller aux Régisseurs</a></p>
              <p><a href="/op" className="text-yellow-500 hover:underline">→ Aller aux OP</a></p>
              <p><a href="/budget" className="text-purple-500 hover:underline">→ Aller au Budget</a></p>
            </div>
          </CardContent>
        </Card>

        {/* Retour au dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Retour</CardTitle>
          </CardHeader>
          <CardContent>
            <button
              onClick={() => handleNavigation('/dashboard')}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Retour au Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}









