'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Search } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

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
  lignes: LigneBudgetaire[];
  onChange: (lignes: LigneBudgetaire[]) => void;
}

const SOURCE_FINANCEMENTS = [
  { value: 'FBP', label: 'FBP' },
  { value: 'CMU', label: 'CMU' },
  { value: 'RP', label: 'RP' },
  { value: 'BE', label: 'BE' },
  { value: 'AUTRES', label: 'Autres' },
] as const;

export default function BudgetStep2Expenses({ lignes, onChange }: Props) {
  const { data: session } = useSession();
  const [nbeLines, setNbeLines] = useState<any[]>([]);
  const [searchNbe, setSearchNbe] = useState<Record<number, string>>({});
  const [showNbeDropdown, setShowNbeDropdown] = useState<number | null>(null);
  const [lastNbeUpdate, setLastNbeUpdate] = useState<Record<number, string>>({});

  useEffect(() => {
    loadNbeLines();
  }, []);

  // Correspondance automatique NBE - déléguée à un useEffect pour ne pas bloquer la saisie
  useEffect(() => {
    if (nbeLines.length === 0) return; // Attendre que les lignes NBE soient chargées
    
    lignes.forEach((ligne, index) => {
      const codeNbe = ligne.ligneNbe?.trim() || '';
      const lastCode = lastNbeUpdate[index] || '';
      
      // Ne faire la correspondance que si:
      // 1. Le code a changé
      // 2. Le code est complet (>= 4 caractères)
      // 3. Le code correspond exactement à une ligne NBE
      if (codeNbe && codeNbe !== lastCode && codeNbe.length >= 4) {
        const matchingNbe = nbeLines.find(
          (n) => !n.isHeader && n.ligne && n.ligne.trim() === codeNbe
        );
        
        if (matchingNbe) {
          console.log('[NBE] Match trouvé automatiquement:', matchingNbe.ligne, matchingNbe.libelle);
          // Mettre à jour le libellé sans toucher au code
          const updated = [...lignes];
          updated[index] = { ...updated[index], libelleNbe: matchingNbe.libelle || '' };
          onChange(updated);
          // Mettre à jour le cache
          setLastNbeUpdate(prev => ({ ...prev, [index]: codeNbe }));
        } else if (ligne.libelleNbe && codeNbe.length >= 4) {
          // Si pas de match et qu'on a un code complet, vider le libellé
          const updated = [...lignes];
          updated[index] = { ...updated[index], libelleNbe: '' };
          onChange(updated);
          setLastNbeUpdate(prev => ({ ...prev, [index]: codeNbe }));
        } else {
          // Mettre à jour le cache même sans match
          setLastNbeUpdate(prev => ({ ...prev, [index]: codeNbe }));
        }
      } else if (!codeNbe && lastCode) {
        // Si le code est vidé, vider aussi le libellé et le cache
        const updated = [...lignes];
        updated[index] = { ...updated[index], libelleNbe: '' };
        onChange(updated);
        setLastNbeUpdate(prev => ({ ...prev, [index]: '' }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lignes.map(l => l.ligneNbe || '').join('|'), nbeLines.length]); // Se déclencher uniquement si les codes NBE changent

  const loadNbeLines = async () => {
    try {
      console.log('[NBE] Chargement des lignes NBE...');
      const res = await apiClient.get('/nbe', { params: { pageSize: 1000, sort: 'ligne', dir: 'asc' } });
      console.log('[NBE] Réponse API:', res.data);
      const items = res.data?.items || [];
      console.log('[NBE] Nombre de lignes chargées:', items.length);
      // Filtrer les en-têtes
      const filteredItems = items.filter((item: any) => !item.isHeader);
      console.log('[NBE] Nombre de lignes après filtrage (sans en-têtes):', filteredItems.length);
      setNbeLines(filteredItems);
    } catch (error: any) {
      console.error('[NBE] Erreur chargement NBE:', error);
      console.error('[NBE] Détails:', error.response?.data || error.message);
      toast.error('Erreur lors du chargement des lignes NBE');
    }
  };

  const handleAdd = () => {
    onChange([
      ...lignes,
      {
        activiteCle: '',
        typeMoyens: '',
        quantite: '1',
        frequence: '1',
        coutUnitaire: '0',
        sourceFinancement: 'FBP',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(lignes.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, field: keyof LigneBudgetaire, value: string) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calcul du montant
    if (field === 'quantite' || field === 'frequence' || field === 'coutUnitaire') {
      const qte = Number(updated[index].quantite || 1);
      const freq = Number(updated[index].frequence || 1);
      const cout = Number(updated[index].coutUnitaire || 0);
      // Le montant est calculé côté backend, on garde juste les valeurs ici
    }
    
    onChange(updated);
  };

  const handleNbeSelect = (index: number, nbeLine: any) => {
    const updated = [...lignes];
    const codeNbe = nbeLine.ligne || '';
    const libelleNbe = nbeLine.libelle || '';
    
    updated[index] = {
      ...updated[index],
      ligneNbe: codeNbe,
      libelleNbe: libelleNbe,
    };
    
    console.log('[NBE] Sélection:', { codeNbe, libelleNbe, index });
    onChange(updated);
    
    // Fermer la dropdown après un court délai pour permettre la mise à jour
    setTimeout(() => {
      setShowNbeDropdown(null);
    }, 100);
    
    setSearchNbe({ ...searchNbe, [index]: codeNbe });
  };

  const handleActivityAutocomplete = async (index: number, query: string) => {
    try {
      const token = await (session as any)?.accessToken;
      const res = await apiClient.get('/budgets/suggestions/activities', {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const suggestions = res.data || [];
      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        const updated = [...lignes];
        updated[index] = {
          ...updated[index],
          activiteCle: suggestion.activiteCle || query,
          typeMoyens: suggestion.typeMoyens || '',
          ligneNbe: suggestion.ligneNbe || '',
          libelleNbe: suggestion.libelleNbe || '',
          sourceFinancement: suggestion.sourceFinancement || 'FBP',
        };
        onChange(updated);
      }
    } catch (error) {
      console.error('Erreur auto-complétion:', error);
    }
  };

  const getFilteredNbe = (index: number) => {
    const search = searchNbe[index] || '';
    return nbeLines.filter(
      (l) =>
        !l.isHeader &&
        (search === '' ||
          l.ligne?.toLowerCase().includes(search.toLowerCase()) ||
          l.libelle?.toLowerCase().includes(search.toLowerCase()))
    );
  };

  const total = lignes.reduce(
    (sum, l) =>
      sum + Number(l.quantite || 1) * Number(l.frequence || 1) * Number(l.coutUnitaire || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Dépenses Détaillées</h3>
        <p className="text-sm text-slate-600 mb-4">
          Ajoutez les dépenses prévues avec leur activité, type de moyens, quantité, fréquence et coût unitaire
        </p>
      </div>

      <div className="space-y-3">
        {lignes.map((ligne, index) => (
          <Card key={index} className="border-slate-200">
            <CardContent className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Activité clé *</label>
                  <Input
                    value={ligne.activiteCle}
                    onChange={(e) => {
                      handleUpdate(index, 'activiteCle', e.target.value);
                      if (e.target.value.length > 3) {
                        handleActivityAutocomplete(index, e.target.value);
                      }
                    }}
                    placeholder="Ex: Assurer la motivation du personnel"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Type de moyens *</label>
                  <Input
                    value={ligne.typeMoyens}
                    onChange={(e) => handleUpdate(index, 'typeMoyens', e.target.value)}
                    placeholder="Ex: Prime ASC T1 2024"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Qté *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ligne.quantite}
                    onChange={(e) => {
                      // Permettre de supprimer complètement le champ
                      const value = e.target.value;
                      // Autoriser les nombres décimaux, vide, ou un seul point
                      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        handleUpdate(index, 'quantite', value);
                      }
                    }}
                    onBlur={(e) => {
                      // Si vide, remettre à "1" par défaut
                      if (!e.target.value || e.target.value.trim() === '') {
                        handleUpdate(index, 'quantite', '1');
                      }
                    }}
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fréq. *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ligne.frequence}
                    onChange={(e) => {
                      // Permettre de supprimer complètement le champ
                      const value = e.target.value;
                      // Autoriser les nombres décimaux, vide, ou un seul point
                      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        handleUpdate(index, 'frequence', value);
                      }
                    }}
                    onBlur={(e) => {
                      // Si vide, remettre à "1" par défaut
                      if (!e.target.value || e.target.value.trim() === '') {
                        handleUpdate(index, 'frequence', '1');
                      }
                    }}
                    placeholder="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Coût Unitaire (CFA) *</label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={ligne.coutUnitaire}
                    onChange={(e) => {
                      // Permettre de supprimer complètement le champ
                      const value = e.target.value;
                      // Autoriser les nombres décimaux, vide, ou un seul point
                      if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
                        handleUpdate(index, 'coutUnitaire', value);
                      }
                    }}
                    onBlur={(e) => {
                      // Si vide, remettre à "0" par défaut
                      if (!e.target.value || e.target.value.trim() === '') {
                        handleUpdate(index, 'coutUnitaire', '0');
                      }
                    }}
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Montant</label>
                  <Input
                    value={(
                      Number(ligne.quantite || 1) *
                      Number(ligne.frequence || 1) *
                      Number(ligne.coutUnitaire || 0)
                    ).toLocaleString()}
                    readOnly
                    className="bg-slate-50 font-semibold"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium mb-2">Ligne / Code (NBE) *</label>
                  <div className="relative">
                    <Input
                      value={ligne.ligneNbe || ''}
                      onChange={(e) => {
                        // SIMPLE: juste mettre à jour le champ, point final
                        // La correspondance automatique NBE est gérée par useEffect pour ne pas bloquer
                        const value = e.target.value;
                        handleUpdate(index, 'ligneNbe', value);
                        setSearchNbe({ ...searchNbe, [index]: value });
                        setShowNbeDropdown(index);
                      }}
                      placeholder="Rechercher ou taper code NBE (ex: 2411)"
                      onFocus={() => {
                        setShowNbeDropdown(index);
                        // Si pas de code actuel, afficher toutes les lignes
                        if (!ligne.ligneNbe) {
                          setSearchNbe({ ...searchNbe, [index]: '' });
                        } else {
                          setSearchNbe({ ...searchNbe, [index]: ligne.ligneNbe || '' });
                        }
                      }}
                      onBlur={() => {
                        // Délai pour permettre le clic sur la dropdown avant de fermer
                        setTimeout(() => setShowNbeDropdown(null), 200);
                      }}
                      onClick={() => {
                        // Ouvrir la dropdown au clic même si vide
                        if (showNbeDropdown !== index) {
                          setShowNbeDropdown(index);
                          setSearchNbe({ ...searchNbe, [index]: ligne.ligneNbe || '' });
                        }
                      }}
                      onKeyDown={(e) => {
                        // Permettre la suppression avec Backspace et Delete
                        if (e.key === 'Backspace' || e.key === 'Delete') {
                          // Autoriser la suppression normale
                          return;
                        }
                        // Empêcher la saisie de caractères invalides si nécessaire
                      }}
                      required
                    />
                    <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    {showNbeDropdown === index && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                        {(() => {
                          const filtered = getFilteredNbe(index);
                          const displayItems = filtered.length > 0 ? filtered : nbeLines.slice(0, 20);
                          return displayItems.length > 0 ? (
                            displayItems.slice(0, 15).map((nbe, i) => (
                              <button
                                key={`${nbe.id || i}-${nbe.ligne}`}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault(); // Empêcher onBlur du input
                                  handleNbeSelect(index, nbe);
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-0 text-sm transition-colors"
                              >
                                <div className="font-mono text-blue-600 font-semibold">{nbe.ligne || 'N/A'}</div>
                                <div className="text-slate-600 text-xs mt-1">{nbe.libelle || ''}</div>
                                {nbe.objetDepense && (
                                  <div className="text-slate-400 text-xs mt-1 line-clamp-1">{nbe.objetDepense}</div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-sm text-slate-500">Aucune ligne NBE trouvée</div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Recherchez dans la Nomenclature du Budget de l'État</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Libellé (NBE) *</label>
                  <Input
                    value={ligne.libelleNbe || ''}
                    readOnly
                    className="bg-slate-50 font-medium"
                    placeholder="Rempli automatiquement depuis NBE"
                    required
                  />
                  {!ligne.libelleNbe && (
                    <p className="text-xs text-amber-600 mt-1">Sélectionnez une ligne NBE ci-contre</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Source de financement *</label>
                  <select
                    value={ligne.sourceFinancement}
                    onChange={(e) => handleUpdate(index, 'sourceFinancement', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOURCE_FINANCEMENTS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button variant="outline" onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une dépense
        </Button>
        <div className="text-right">
          <p className="text-sm text-slate-600">Total des dépenses</p>
          <p className="text-2xl font-bold text-red-600">{total.toLocaleString()} CFA</p>
        </div>
      </div>
    </div>
  );
}
