'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, FileText, CheckCircle, Info, Eye } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type SourceRecette = {
  type: 'BE' | 'RESSOURCES_PROPRES' | 'PTF' | 'DONS_LEGS' | 'FBP' | 'CMU' | 'SOLDE_BANCAIRE' | 'REMBOURSEMENT_A_RECEVOIR';
  nature?: string;
  montant: string;
};

interface Props {
  sources: SourceRecette[];
  onChange: (sources: SourceRecette[]) => void;
  onValidate?: (sources: SourceRecette[]) => void;
  isValidated?: boolean;
}

const SOURCE_TYPES = [
  { value: 'BE', label: 'BE (Budget de l\'État)' },
  { value: 'RESSOURCES_PROPRES', label: 'Ressources Propres' },
  { value: 'PTF', label: 'PTF (Partenaires Techniques et Financiers)' },
  { value: 'DONS_LEGS', label: 'Dons / Legs' },
  { value: 'FBP', label: 'FBP (Fonds de Bonne Performance)' },
  { value: 'CMU', label: 'CMU (Couverture Maladie Universelle)' },
  { value: 'SOLDE_BANCAIRE', label: 'Solde Bancaire' },
  { value: 'REMBOURSEMENT_A_RECEVOIR', label: 'Remboursement à recevoir' },
] as const;

export default function BudgetStep1Sources({ sources, onChange, onValidate, isValidated = false }: Props) {
  // Si aucune source n'existe et que ce n'est pas validé, en ajouter une par défaut
  const handleAdd = () => {
    if (!isValidated) {
      onChange([
        ...sources,
        { type: 'BE', montant: '0', nature: '' },
      ]);
    }
  };

  const handleRemove = (index: number) => {
    if (!isValidated) {
      onChange(sources.filter((_, i) => i !== index));
    }
  };

  const handleUpdate = (index: number, field: keyof SourceRecette, value: string) => {
    if (!isValidated) {
      const updated = [...sources];
      updated[index] = { ...updated[index], [field]: value };
      onChange(updated);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const total = sources.reduce((sum, s) => sum + Number(s.montant || 0), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-bold text-slate-800">Tableau de Prévision des Recettes</h3>
        </div>
        <p className="text-sm text-slate-600">
          Renseignez les sources de financement prévues pour votre Plan d'Action Annuel (PAA).
          Vous pouvez ajouter plusieurs sources de financement.
        </p>
      </div>

      {/* Tableau des sources de financement */}
      <Card className="border-2 border-slate-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px] text-center font-semibold">N°</TableHead>
                <TableHead className="font-semibold">Source de Financement</TableHead>
                <TableHead className="font-semibold">Nature (Optionnel)</TableHead>
                <TableHead className="text-right font-semibold">Montant (FCFA)</TableHead>
                <TableHead className="w-[80px] text-center font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p>Aucune source de financement ajoutée</p>
                      <Button variant="outline" size="sm" onClick={handleAdd} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Ajouter une source
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                sources.map((source, index) => (
                  <TableRow key={index} className="hover:bg-slate-50">
                    <TableCell className="text-center font-medium text-slate-600">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <select
                        value={source.type}
                        onChange={(e) => handleUpdate(index, 'type', e.target.value as SourceRecette['type'])}
                        disabled={isValidated}
                        className={`w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm ${isValidated ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      >
                        {SOURCE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={source.nature || ''}
                        onChange={(e) => handleUpdate(index, 'nature', e.target.value)}
                        placeholder="Ex: Subvention, Allocation..."
                        disabled={isValidated}
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 ${isValidated ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          value={source.montant}
                          onChange={(e) => handleUpdate(index, 'montant', e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.01"
                          disabled={isValidated}
                          className={`text-right border-slate-300 focus:border-blue-500 focus:ring-blue-500 font-medium ${isValidated ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                          onFocus={(e) => !isValidated && e.target.select()}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {!isValidated && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(index)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Total */}
          {sources.length > 0 && (
            <div className="border-t border-slate-200 bg-blue-50 px-4 py-4">
              <div className="flex justify-between items-center">
                {!isValidated && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAdd}
                      className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une source
                    </Button>
                  </div>
                )}
                {isValidated && (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Sources validées - Consultation seule</span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600">Total des recettes prévues</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {formatCurrency(total)} FCFA
                    </p>
                  </div>
                  {onValidate && !isValidated && (
                    <Button
                      onClick={() => {
                        const hasValidSource = sources.some((s) => Number(s.montant) > 0);
                        if (!hasValidSource) {
                          alert('Veuillez renseigner au moins une source avec un montant supérieur à 0');
                          return;
                        }
                        onValidate(sources);
                      }}
                      className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Valider
                    </Button>
                  )}
                  {isValidated && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Validé</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message d'aide */}
      {sources.length === 0 ? (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Cliquez sur "Ajouter une source" ci-dessus pour commencer à renseigner les sources de financement de votre PAA.
            </p>
          </CardContent>
        </Card>
      ) : !isValidated && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800 space-y-1">
                <p><strong>💡 Astuce :</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Cliquez sur l'icône <strong>🗑️ (corbeille)</strong> à droite de chaque ligne pour supprimer une source</li>
                  <li>Modifiez les montants directement dans le tableau</li>
                  <li>Cliquez sur <strong>"Valider"</strong> quand vous avez terminé pour enregistrer et consulter le récapitulatif</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

