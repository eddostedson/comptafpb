'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SourceRecette = {
  type: 'BE' | 'RESSOURCES_PROPRES' | 'PTF' | 'DONS_LEGS' | 'FBP' | 'CMU' | 'SOLDE_BANCAIRE';
  nature?: string;
  montant: string;
};

type LigneBudgetaire = {
  activiteCle: string;
  typeMoyens: string;
  quantite: string;
  frequence: string;
  coutUnitaire: string;
  ligneNbe?: string;
  libelleNbe?: string;
  sourceFinancement: 'FBP' | 'CMU' | 'RP' | 'BE' | 'AUTRES';
};

interface Props {
  sources: SourceRecette[];
  lignes: LigneBudgetaire[];
  nom: string;
  description?: string;
  annee: number;
  type: string;
}

const SOURCE_MAPPING: Record<string, string[]> = {
  BE: ['BE'],
  RESSOURCES_PROPRES: ['RP'],
  PTF: ['AUTRES'],
  DONS_LEGS: ['AUTRES'],
};

export default function BudgetStep3Summary({ sources, lignes, nom, description, annee, type }: Props) {
  const calculations = useMemo(() => {
    // Calculer les totaux de recettes par source
    const recettesParSource: Record<string, number> = {};
    sources.forEach((s) => {
      recettesParSource[s.type] = (recettesParSource[s.type] || 0) + Number(s.montant || 0);
    });

    // Calculer les totaux de dépenses par source de financement
    const depensesParSource: Record<string, number> = {};
    lignes.forEach((l) => {
      const montant = Number(l.quantite || 1) * Number(l.frequence || 1) * Number(l.coutUnitaire || 0);
      depensesParSource[l.sourceFinancement] = (depensesParSource[l.sourceFinancement] || 0) + montant;
    });

    // Totaux généraux
    const totalRecettes = sources.reduce((sum, s) => sum + Number(s.montant || 0), 0);
    const totalDepenses = lignes.reduce(
      (sum, l) =>
        sum + Number(l.quantite || 1) * Number(l.frequence || 1) * Number(l.coutUnitaire || 0),
      0
    );

    // Validation : vérifier que les dépenses ne dépassent pas les recettes par source
    const validations: { source: string; recette: number; depense: number; isValid: boolean }[] = [];

    // Mapping des sources de recettes aux sources de financement
    const recetteToFinancement: Record<string, string[]> = {
      BE: ['BE'],
      RESSOURCES_PROPRES: ['RP'],
      PTF: ['AUTRES'],
      DONS_LEGS: ['AUTRES'],
    };

    // Calculer pour chaque source de financement
    const sourcesFinancement = ['FBP', 'CMU', 'RP', 'BE', 'AUTRES'] as const;
    sourcesFinancement.forEach((sf) => {
      const depense = depensesParSource[sf] || 0;
      if (depense > 0) {
        // Trouver la source de recette correspondante
        let recette = 0;
        if (sf === 'BE') {
          recette = recettesParSource['BE'] || 0;
        } else if (sf === 'RP') {
          recette = recettesParSource['RESSOURCES_PROPRES'] || 0;
        } else if (sf === 'AUTRES') {
          recette = (recettesParSource['PTF'] || 0) + (recettesParSource['DONS_LEGS'] || 0);
        } else if (sf === 'FBP') {
          // FBP peut venir de n'importe quelle source
          recette = totalRecettes;
        } else if (sf === 'CMU') {
          // CMU peut venir de n'importe quelle source
          recette = totalRecettes;
        }

        validations.push({
          source: sf,
          recette,
          depense,
          isValid: depense <= recette,
        });
      }
    });

    return {
      recettesParSource,
      depensesParSource,
      totalRecettes,
      totalDepenses,
      validations,
      isValid: validations.every((v) => v.isValid),
    };
  }, [sources, lignes]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Récapitulatif du Budget</h3>
        <p className="text-sm text-slate-600 mb-4">
          Vérifiez les totaux et la cohérence entre les recettes et les dépenses
        </p>
      </div>

      {/* Informations générales */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg">Informations du Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Nom</p>
              <p className="font-semibold">{nom || 'Non renseigné'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Année</p>
              <p className="font-semibold">{annee}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Type</p>
              <p className="font-semibold">{type.replace('_', ' ')}</p>
            </div>
            {description && (
              <div>
                <p className="text-sm text-slate-600">Description</p>
                <p className="font-semibold">{description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Totaux généraux */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-green-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Total des Recettes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {calculations.totalRecettes.toLocaleString()} CFA
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Total des Dépenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              {calculations.totalDepenses.toLocaleString()} CFA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détail par source de financement (Image 3) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Coût des Activités par Source de Financement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* FBP */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
              <div>
                <p className="font-semibold">COÛT DES ACTIVITÉS FBP</p>
                <p className="text-sm text-slate-600">
                  {lignes.filter((l) => l.sourceFinancement === 'FBP').length} ligne(s)
                </p>
              </div>
              <p className="text-xl font-bold">
                {(calculations.depensesParSource['FBP'] || 0).toLocaleString()} CFA
              </p>
            </div>

            {/* CMU */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
              <div>
                <p className="font-semibold">COÛT DES ACTIVITÉS CMU</p>
                <p className="text-sm text-slate-600">
                  {lignes.filter((l) => l.sourceFinancement === 'CMU').length} ligne(s)
                </p>
              </div>
              <p className="text-xl font-bold">
                {(calculations.depensesParSource['CMU'] || 0).toLocaleString()} CFA
              </p>
            </div>

            {/* RP */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
              <div>
                <p className="font-semibold">COÛT DES ACTIVITÉS RP</p>
                <p className="text-sm text-slate-600">
                  {lignes.filter((l) => l.sourceFinancement === 'RP').length} ligne(s)
                </p>
              </div>
              <p className="text-xl font-bold">
                {(calculations.depensesParSource['RP'] || 0).toLocaleString()} CFA
              </p>
            </div>

            {/* BE */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
              <div>
                <p className="font-semibold">COÛT DES ACTIVITÉS BE</p>
                <p className="text-sm text-slate-600">
                  {lignes.filter((l) => l.sourceFinancement === 'BE').length} ligne(s)
                </p>
              </div>
              <p className="text-xl font-bold">
                {(calculations.depensesParSource['BE'] || 0).toLocaleString()} CFA
              </p>
            </div>

            {/* Autres */}
            <div className="flex justify-between items-center p-4 bg-slate-50 rounded-md">
              <div>
                <p className="font-semibold">COÛT DES ACTIVITÉS (AUTRES RESSOURCES)</p>
                <p className="text-sm text-slate-600">
                  {lignes.filter((l) => l.sourceFinancement === 'AUTRES').length} ligne(s)
                </p>
              </div>
              <p className="text-xl font-bold">
                {(calculations.depensesParSource['AUTRES'] || 0).toLocaleString()} CFA
              </p>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center p-4 bg-blue-50 border-2 border-blue-200 rounded-md mt-4">
              <div>
                <p className="font-bold text-lg">COÛT TOTAL DES ACTIVITÉS</p>
                <p className="text-sm text-slate-600">{lignes.length} ligne(s) au total</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {calculations.totalDepenses.toLocaleString()} CFA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation */}
      <Card className={calculations.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {calculations.isValid ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Validation : Budget équilibré
              </>
            ) : (
              <>
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Validation : Erreurs détectées
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {calculations.isValid ? (
            <p className="text-green-700">
              ✅ Toutes les dépenses sont couvertes par les recettes correspondantes.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700 font-semibold mb-2">
                ⚠️ Certaines dépenses dépassent les recettes disponibles :
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {calculations.validations
                  .filter((v) => !v.isValid)
                  .map((v) => (
                    <li key={v.source}>
                      <strong>{v.source}:</strong> Dépenses {v.depense.toLocaleString()} CFA &gt;
                      Recettes {v.recette.toLocaleString()} CFA (manque{' '}
                      {(v.depense - v.recette).toLocaleString()} CFA)
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

