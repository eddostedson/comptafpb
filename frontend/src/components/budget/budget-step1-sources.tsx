'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SourceRecette = {
  type: 'BE' | 'RESSOURCES_PROPRES' | 'PTF' | 'DONS_LEGS' | 'FBP' | 'CMU' | 'SOLDE_BANCAIRE';
  nature?: string;
  montant: string;
};

interface Props {
  sources: SourceRecette[];
  onChange: (sources: SourceRecette[]) => void;
}

const SOURCE_TYPES = [
  { value: 'BE', label: 'BE' },
  { value: 'RESSOURCES_PROPRES', label: 'Ressources propres' },
  { value: 'PTF', label: 'PTF' },
  { value: 'DONS_LEGS', label: 'Dons / Legs' },
  { value: 'FBP', label: 'FBP' },
  { value: 'CMU', label: 'CMU' },
  { value: 'SOLDE_BANCAIRE', label: 'Solde bancaire' },
] as const;

export default function BudgetStep1Sources({ sources, onChange }: Props) {
  const handleAdd = () => {
    onChange([
      ...sources,
      { type: 'BE', montant: '0' },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(sources.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof SourceRecette, value: string) => {
    const updated = [...sources];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const total = sources.reduce((sum, s) => sum + Number(s.montant || 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Sources de Recettes (Revenus)</h3>
        <p className="text-sm text-slate-600 mb-4">
          Définissez les sources de financement prévues pour votre budget annuel
        </p>
      </div>

      <div className="space-y-3">
        {sources.map((source, index) => (
          <Card key={index} className="border-slate-200">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">Type de ressource *</label>
                  <select
                    value={source.type}
                    onChange={(e) => handleUpdate(index, 'type', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Nature (optionnel)</label>
                  <Input
                    value={source.nature || ''}
                    onChange={(e) => handleUpdate(index, 'nature', e.target.value)}
                    placeholder="Nature de la ressource"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-2">Montant (CFA) *</label>
                    <Input
                      type="number"
                      value={source.montant}
                      onChange={(e) => handleUpdate(index, 'montant', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  {sources.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemove(index)}
                      className="mb-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une source
        </Button>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total des recettes</p>
          <p className="text-2xl font-bold text-green-600">{total.toLocaleString()} CFA</p>
        </div>
      </div>
    </div>
  );
}

