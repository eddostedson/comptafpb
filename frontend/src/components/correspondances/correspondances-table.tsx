'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronUp,
  Activity,
  DollarSign,
  Percent,
  Target
} from 'lucide-react';

interface CorrespondanceActivite {
  id: string;
  codeActivite: string;
  nomActivite: string;
  description: string;
  categorie: string;
  sousCategorie: string;
  pourcentage: number;
  montantMax: number;
  priorite: number;
  valide: boolean;
  ligneBudgetaire: {
    id: string;
    code: string;
    libelle: string;
    chapitre: string;
    section: string;
    paragraphe: string;
    article: string;
    montantPrevu: number;
  };
}

export default function CorrespondancesTable() {
  const [correspondances, setCorrespondances] = useState<CorrespondanceActivite[]>([]);
  const [filteredCorrespondances, setFilteredCorrespondances] = useState<CorrespondanceActivite[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [sortField, setSortField] = useState<keyof CorrespondanceActivite>('codeActivite');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Données d'exemple (en attendant l'API)
  const sampleData: CorrespondanceActivite[] = [
    {
      id: '1',
      codeActivite: 'ACT-001',
      nomActivite: 'Consultations médicales générales',
      description: 'Consultations de médecine générale pour patients externes',
      categorie: 'SOINS_MEDICAUX',
      sousCategorie: 'CONSULTATIONS',
      pourcentage: 25.0,
      montantMax: 50000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '1',
        code: '01.01.01',
        libelle: 'Salaires du personnel médical',
        chapitre: '01',
        section: '01',
        paragraphe: '01',
        article: '01',
        montantPrevu: 250000
      }
    },
    {
      id: '2',
      codeActivite: 'ACT-002',
      nomActivite: 'Soins infirmiers',
      description: 'Soins infirmiers et suivi des patients',
      categorie: 'SOINS_MEDICAUX',
      sousCategorie: 'SOINS_INFIRMIERS',
      pourcentage: 30.0,
      montantMax: 60000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '2',
        code: '01.01.02',
        libelle: 'Salaires du personnel infirmier',
        chapitre: '01',
        section: '01',
        paragraphe: '01',
        article: '02',
        montantPrevu: 300000
      }
    },
    {
      id: '3',
      codeActivite: 'ACT-003',
      nomActivite: 'Accouchements',
      description: 'Accouchements et soins obstétricaux',
      categorie: 'SOINS_MEDICAUX',
      sousCategorie: 'OBSTETRIQUE',
      pourcentage: 20.0,
      montantMax: 40000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '3',
        code: '01.01.03',
        libelle: 'Salaires du personnel obstétrical',
        chapitre: '01',
        section: '01',
        paragraphe: '01',
        article: '03',
        montantPrevu: 200000
      }
    },
    {
      id: '4',
      codeActivite: 'ACT-004',
      nomActivite: 'Vaccinations',
      description: 'Campagnes de vaccination et immunisation',
      categorie: 'PREVENTION',
      sousCategorie: 'VACCINATION',
      pourcentage: 15.0,
      montantMax: 30000,
      priorite: 2,
      valide: true,
      ligneBudgetaire: {
        id: '4',
        code: '01.01.04',
        libelle: 'Salaires du personnel de prévention',
        chapitre: '01',
        section: '01',
        paragraphe: '01',
        article: '04',
        montantPrevu: 150000
      }
    },
    {
      id: '5',
      codeActivite: 'ACT-005',
      nomActivite: 'Chirurgie mineure',
      description: 'Interventions chirurgicales mineures',
      categorie: 'SOINS_MEDICAUX',
      sousCategorie: 'CHIRURGIE',
      pourcentage: 10.0,
      montantMax: 20000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '5',
        code: '01.01.05',
        libelle: 'Salaires du personnel chirurgical',
        chapitre: '01',
        section: '01',
        paragraphe: '01',
        article: '05',
        montantPrevu: 100000
      }
    },
    {
      id: '6',
      codeActivite: 'ACT-006',
      nomActivite: 'Achat de médicaments',
      description: 'Acquisition de médicaments essentiels',
      categorie: 'FONCTIONNEMENT',
      sousCategorie: 'MEDICAMENTS',
      pourcentage: 40.0,
      montantMax: 80000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '6',
        code: '02.01.01',
        libelle: 'Achat de médicaments',
        chapitre: '02',
        section: '01',
        paragraphe: '01',
        article: '01',
        montantPrevu: 200000
      }
    },
    {
      id: '7',
      codeActivite: 'ACT-007',
      nomActivite: 'Achat de matériel médical',
      description: 'Acquisition de matériel et équipements médicaux',
      categorie: 'FONCTIONNEMENT',
      sousCategorie: 'MATERIEL_MEDICAL',
      pourcentage: 25.0,
      montantMax: 50000,
      priorite: 1,
      valide: true,
      ligneBudgetaire: {
        id: '7',
        code: '02.01.02',
        libelle: 'Achat de matériel médical',
        chapitre: '02',
        section: '01',
        paragraphe: '01',
        article: '02',
        montantPrevu: 100000
      }
    }
  ];

  useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      setCorrespondances(sampleData);
      setFilteredCorrespondances(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    let filtered = correspondances;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(corr => 
        corr.nomActivite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corr.codeActivite.toLowerCase().includes(searchTerm.toLowerCase()) ||
        corr.ligneBudgetaire.libelle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(corr => corr.categorie === selectedCategory);
    }

    // Filtrage par priorité
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(corr => corr.priorite.toString() === selectedPriority);
    }

    setFilteredCorrespondances(filtered);
  }, [correspondances, searchTerm, selectedCategory, selectedPriority]);

  const handleSort = (field: keyof CorrespondanceActivite) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getPriorityColor = (priorite: number) => {
    switch (priorite) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priorite: number) => {
    switch (priorite) {
      case 1: return '🔴';
      case 2: return '🟡';
      case 3: return '🟢';
      default: return '⚪';
    }
  };

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'SOINS_MEDICAUX': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'FONCTIONNEMENT': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PREVENTION': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtres et contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une activité..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les catégories</option>
            <option value="SOINS_MEDICAUX">Soins Médicaux</option>
            <option value="FONCTIONNEMENT">Fonctionnement</option>
            <option value="PREVENTION">Prévention</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Toutes les priorités</option>
            <option value="1">Haute priorité</option>
            <option value="2">Moyenne priorité</option>
            <option value="3">Faible priorité</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDetails ? 'Masquer détails' : 'Afficher détails'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Tableau des correspondances */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th 
                className="text-left p-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('codeActivite')}
              >
                <div className="flex items-center gap-2">
                  Code Activité
                  {sortField === 'codeActivite' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="text-left p-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('nomActivite')}
              >
                <div className="flex items-center gap-2">
                  Nom de l'Activité
                  {sortField === 'nomActivite' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="text-left p-4 font-semibold text-slate-700">Catégorie</th>
              <th className="text-left p-4 font-semibold text-slate-700">Ligne Budgétaire</th>
              <th className="text-right p-4 font-semibold text-slate-700">Pourcentage</th>
              <th className="text-right p-4 font-semibold text-slate-700">Montant Max</th>
              <th className="text-center p-4 font-semibold text-slate-700">Priorité</th>
            </tr>
          </thead>
          <tbody>
            {filteredCorrespondances.map((corr) => (
              <tr key={corr.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-mono text-sm font-medium text-blue-600">
                    {corr.codeActivite}
                  </div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-800">{corr.nomActivite}</div>
                  {showDetails && (
                    <div className="text-sm text-slate-500 mt-1">{corr.description}</div>
                  )}
                </td>
                <td className="p-4">
                  <Badge className={`${getCategoryColor(corr.categorie)} border`}>
                    {corr.categorie.replace('_', ' ')}
                  </Badge>
                  {showDetails && (
                    <div className="text-sm text-slate-500 mt-1">{corr.sousCategorie}</div>
                  )}
                </td>
                <td className="p-4">
                  <div className="font-mono text-sm font-medium text-slate-700">
                    {corr.ligneBudgetaire.code}
                  </div>
                  <div className="text-sm text-slate-600">{corr.ligneBudgetaire.libelle}</div>
                  {showDetails && (
                    <div className="text-xs text-slate-500 mt-1">
                      Ch. {corr.ligneBudgetaire.chapitre} - S. {corr.ligneBudgetaire.section} - P. {corr.ligneBudgetaire.paragraphe} - A. {corr.ligneBudgetaire.article}
                    </div>
                  )}
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Percent className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">{corr.pourcentage}%</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-800">
                      {corr.montantMax.toLocaleString()} XAF
                    </span>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <Badge className={`${getPriorityColor(corr.priorite)} border`}>
                    <span className="mr-1">{getPriorityIcon(corr.priorite)}</span>
                    {corr.priorite === 1 ? 'Haute' : corr.priorite === 2 ? 'Moyenne' : 'Faible'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-slate-600">
        <div>
          Affichage de {filteredCorrespondances.length} correspondance(s) sur {correspondances.length}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Total: {correspondances.reduce((sum, c) => sum + c.montantMax, 0).toLocaleString()} XAF</span>
          </div>
        </div>
      </div>
    </div>
  );
}





