/*
  Importe la NBE depuis un fichier Excel dans la table nbe_lines.
  Usage:
    pnpm exec ts-node prisma/import-nbe-excel.ts --file="docs/Outil 14 Tableau...xlsx" --sheet="Feuil1" --headerRow=1

  - --file: chemin vers l'Excel (obligatoire)
  - --sheet: nom de la feuille à lire (optionnel: 1ère feuille si absent)
  - --headerRow: numéro de ligne d'en-tête (1 par défaut)
*/

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');

const prisma = new PrismaClient();

type RawRow = Record<string, any>;

function parseArgs(): { file: string; sheet?: string; headerRow: number } {
  const args = process.argv.slice(2);
  const get = (key: string) => {
    const match = args.find((a) => a.startsWith(`--${key}=`));
    return match ? match.substring(key.length + 3) : undefined;
  };
  const file = get('file');
  const sheet = get('sheet');
  const headerRowStr = get('headerRow');
  const headerRow = headerRowStr ? Number(headerRowStr) : 1;
  if (!file) {
    console.error('❌ Paramètre --file manquant. Exemple: --file="docs/NBE.xlsx"');
    process.exit(1);
  }
  return { file, sheet, headerRow };
}

function normalizeKey(key: string): string {
  return String(key || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function findSheetName(wb: any, requested?: string): string | undefined {
  const names: string[] = wb.SheetNames || [];
  if (!requested) return names[0];

  const trimmed = String(requested).trim();
  // Si numérique: index (1-based)
  if (/^\d+$/.test(trimmed)) {
    const idx = Math.max(1, parseInt(trimmed, 10)) - 1;
    return names[idx];
  }

  // Essais successifs: exact, case-insensitive, normalisé sans accents/espaces multiples
  const lower = trimmed.toLowerCase();
  const normalized = normalizeKey(trimmed);

  // exact
  if (names.includes(trimmed)) return trimmed;
  // case-insensitive
  const ci = names.find((n) => n.toLowerCase() === lower);
  if (ci) return ci;
  // normalized
  const normMap = new Map(names.map((n) => [normalizeKey(n), n] as const));
  const viaNorm = normMap.get(normalized);
  if (viaNorm) return viaNorm;

  return undefined;
}

function mapRowToNbe(row: RawRow) {
  // On tente de reconnaître les colonnes usuelles par similarité d'en-têtes
  const entries = Object.entries(row);
  const lookup = new Map<string, any>();
  for (const [k, v] of entries) {
    lookup.set(normalizeKey(k), v);
  }

  const get = (...candidates: string[]) => {
    // exact match on normalized key
    for (const c of candidates) {
      if (lookup.has(c)) return lookup.get(c);
    }
    // fallback: include match (header contains candidate words)
    const keys = Array.from(lookup.keys());
    for (const c of candidates) {
      const k = keys.find((k) => k.includes(c));
      if (k) return lookup.get(k);
    }
    return undefined;
  };

  const ligne = get('ligne', 'code', 'code nbe', 'nbe', 'numero', 'n°');
  const libelle = get('libelle', 'libellé', 'intitule', 'intitulé', 'designation', 'désignation');
  const objetDepense = get(
    'objet',
    'objet depense',
    'objet de la depense',
    'objet de la depense (liste non exhaustives)',
    'liste non exhaustives',
    'description',
    'commentaire'
  );
  const categorie = get('categorie', 'catégorie', 'groupe', 'famille');
  const sousCategorie = get('sous categorie', 'sous-categorie', 'sous-catégorie', 'sous categorie nbe');
  const isHeaderRaw = get('isheader', 'entete', 'en-tete', 'header');
  const isHighlightedRaw = get('ishighlighted', 'highlight', 'important');
  const ordreRaw = get('ordre', 'order', 'position');

  // Coercitions simples
  const isHeader =
    String(isHeaderRaw ?? '').trim().toLowerCase() === 'true' ||
    String(isHeaderRaw ?? '').trim() === '1' ||
    // Heuristique: pas de code de ligne et un libellé présent => ligne d'en-tête
    ((ligne === undefined || String(ligne).trim() === '') && String(libelle ?? '').trim() !== '');
  const isHighlighted = String(isHighlightedRaw ?? '').trim().toLowerCase() === 'true' || String(isHighlightedRaw ?? '').trim() === '1';
  const ordre = ordreRaw !== undefined && ordreRaw !== '' ? Number(ordreRaw) : undefined;

  const safeLigne = (() => {
    if (ligne === undefined || ligne === null) return null;
    const s = String(ligne).trim();
    return s === '' ? null : s;
  })();

  const safeLibelle = String(libelle ?? '').trim();
  const safeObjet = (() => {
    if (objetDepense === undefined || objetDepense === null) return null;
    const s = String(objetDepense).trim();
    return s === '' ? null : s;
  })();
  const safeCategorie = String(categorie ?? '').trim() || 'AUTRE';
  const safeSousCategorie = (() => {
    if (sousCategorie === undefined || sousCategorie === null) return null;
    const s = String(sousCategorie).trim();
    return s === '' ? null : s;
  })();

  return {
    ligne: safeLigne,
    libelle: safeLibelle,
    objetDepense: safeObjet,
    categorie: safeCategorie,
    sousCategorie: safeSousCategorie,
    isHeader,
    isHighlighted,
    ordre,
  };
}

async function main() {
  const { file, sheet, headerRow } = parseArgs();
  const absPath = path.isAbsolute(file) ? file : path.join(process.cwd(), '..', file).replace(/\\/g, '/');
  if (!fs.existsSync(absPath)) {
    console.error(`❌ Fichier introuvable: ${absPath}`);
    process.exit(1);
  }

  console.log(`📄 Lecture Excel: ${absPath}`);
  const wb = XLSX.readFile(absPath);
  const sheetName = findSheetName(wb, sheet);
  if (!sheetName) {
    console.error('❌ Aucune feuille trouvée dans le fichier Excel.');
    console.error(`Feuilles disponibles: ${wb.SheetNames?.join(', ')}`);
    process.exit(1);
  }
  console.log(`📑 Feuille: ${sheetName}`);

  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.error(`❌ Feuille non trouvée: ${sheetName}`);
    console.error(`Feuilles disponibles: ${wb.SheetNames?.join(', ')}`);
    process.exit(1);
  }

  const json: RawRow[] = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (!json.length) {
    console.error('❌ La feuille est vide.');
    process.exit(1);
  }

  // Construire des objets par paires en-têtes/valeurs à partir de la ligne d'en-tête
  const headerIdx = Math.max(1, headerRow) - 1;
  const headers = (json[headerIdx] as any[]) || [];
  const dataRows = json.slice(headerIdx + 1);
  const rows: RawRow[] = dataRows.map((row: any[]) => {
    const obj: RawRow = {};
    headers.forEach((h, i) => {
      obj[String(h || `col_${i + 1}`)] = row[i];
    });
    return obj;
  });

  // Mapping → NbeLine[] (sans id, timestamps)
  const mapped = rows
    .map(mapRowToNbe)
    .filter((r) => (r.libelle && r.libelle.trim().length > 0) || r.isHeader)
    .map((r, i) => {
      // Assigner un ordre croissant si absent afin de préserver l'ordre Excel
      const ordre = r.ordre ?? i + 1;
      // Normaliser les lignes d'entête
      if (r.isHeader) {
        return {
          ...r,
          ligne: null,
          categorie: r.libelle || r.categorie || 'SECTION',
          ordre,
        };
      }
      return { ...r, ordre };
    });

  console.log(`🧮 Lignes lues: ${rows.length}, importées: ${mapped.length}`);

  // Remplacement complet
  console.log('🧹 Nettoyage table nbe_lines...');
  await prisma.nbeLine.deleteMany({});

  const chunkSize = 1000;
  let inserted = 0;
  for (let i = 0; i < mapped.length; i += chunkSize) {
    const chunk = mapped.slice(i, i + chunkSize);
    const res = await prisma.nbeLine.createMany({ data: chunk });
    inserted += res.count;
    console.log(`   → Insert: +${res.count} (total ${inserted}/${mapped.length})`);
  }

  console.log(`✅ Import terminé. ${inserted} lignes NBE insérées.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


