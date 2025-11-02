
'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown,
  ChevronUp,
  Building2,
  Wrench,
  Car,
  Computer,
  Zap,
  Droplets,
  Shield,
  Users,
  Activity
} from 'lucide-react';

interface NBELine {
  id: string;
  ligne?: string | null;
  libelle: string;
  objetDepense?: string | null;
  categorie: string;
  sousCategorie?: string | null;
  isHeader?: boolean;
  isHighlighted?: boolean;
}

export default function NBETable() {
  const [nbeLines, setNbeLines] = useState<NBELine[]>([]);
  const [filteredLines, setFilteredLines] = useState<NBELine[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'mock'>('mock');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortField, setSortField] = useState<keyof NBELine>('ligne');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Table des matières (ancres par section)
  const sectionRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

  const makeSlug = (text: string) =>
    (text || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const getSectionColor = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('immobilisation')) return 'bg-blue-50 text-blue-800 border-blue-200';
    if (t.includes('charges de personnel')) return 'bg-pink-50 text-pink-800 border-pink-200';
    if (t.includes('comptes de charges')) return 'bg-amber-50 text-amber-800 border-amber-200';
    if (t.includes('acquisitions de services')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (t.includes('achats') || t.includes('fournitures')) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    return 'bg-slate-50 text-slate-800 border-slate-200';
  };

  // Données NBE complètes basées sur les 7 images
  const sampleData: NBELine[] = [
    // COMPTES D'IMMOBILISATIONS
    {
      id: '1',
      ligne: '',
      libelle: 'COMPTES d\' IMMOBILISATIONS',
      objetDepense: '',
      categorie: 'IMMOBILISATIONS',
      isHeader: true
    },
    {
      id: '2',
      ligne: '2131',
      libelle: 'Conception de systèmes d\'organisation - progiciels',
      objetDepense: '',
      categorie: 'IMMOBILISATIONS',
      sousCategorie: 'INCORPORELLES'
    },
    {
      id: '3',
      ligne: '2192',
      libelle: 'Autres immobilisations incorporelles',
      objetDepense: '',
      categorie: 'IMMOBILISATIONS',
      sousCategorie: 'INCORPORELLES'
    },

    // ACQUISITIONS ET AMÉNAGEMENTS DES SOLS
    {
      id: '4',
      ligne: '',
      libelle: 'Acquisitions et aménagements des sols et sous- sols',
      objetDepense: '',
      categorie: 'SOLS',
      isHeader: true
    },
    {
      id: '5',
      ligne: '2213',
      libelle: 'Constructions de clôture',
      objetDepense: 'Construction de clôture autour du centre de santé',
      categorie: 'SOLS',
      sousCategorie: 'CLOTURES'
    },

    // ACQUISITIONS, CONSTRUCTIONS ET GROSSES RÉPARATIONS DES IMMEUBLES
    {
      id: '6',
      ligne: '',
      libelle: 'Acquisitions, constructions et grosses réparations des immeubles',
      objetDepense: '',
      categorie: 'IMMEUBLES',
      isHeader: true
    },
    {
      id: '7',
      ligne: '2311',
      libelle: 'Bâtiments administratifs à usage de bureau',
      objetDepense: '',
      categorie: 'IMMEUBLES',
      sousCategorie: 'BATIMENTS'
    },
    {
      id: '8',
      ligne: '2343',
      libelle: 'Réseaux d\'eau',
      objetDepense: 'Travaux d\'adduction d\'eau potable dans le centre de santé',
      categorie: 'IMMEUBLES',
      sousCategorie: 'RESEAUX',
      isHighlighted: true
    },
    {
      id: '9',
      ligne: '2344',
      libelle: 'Réseaux d\'assainissement',
      objetDepense: 'Travaux de curage et d\'assainissement',
      categorie: 'IMMEUBLES',
      sousCategorie: 'RESEAUX',
      isHighlighted: true
    },
    {
      id: '10',
      ligne: '2345',
      libelle: 'Réseaux d\'électricité',
      objetDepense: 'Travaux de mise en place de réseaux d\'électricité dans le centre de santé',
      categorie: 'IMMEUBLES',
      sousCategorie: 'RESEAUX',
      isHighlighted: true
    },
    {
      id: '11',
      ligne: '2361',
      libelle: 'Réseaux informatiques',
      objetDepense: 'Travaux de cablage de reseaux informatiques',
      categorie: 'IMMEUBLES',
      sousCategorie: 'RESEAUX',
      isHighlighted: true
    },
    {
      id: '12',
      ligne: '2394',
      libelle: 'Agencement, aménagement, installation de bureau',
      objetDepense: '',
      categorie: 'IMMEUBLES',
      sousCategorie: 'AMENAGEMENTS'
    },

    // ACQUISITIONS ET GROSSES RÉPARATIONS DU MATÉRIEL ET MOBILIER
    {
      id: '13',
      ligne: '',
      libelle: 'Acquisitions et grosses réparations du matériel et mobilier',
      objetDepense: '',
      categorie: 'MATERIEL',
      isHeader: true
    },
    {
      id: '14',
      ligne: '2411',
      libelle: 'Mobilier et matériel de bureau (autre qu\'informatique)',
      objetDepense: 'Acquisition de lave-main, chaises visiteurs, bancs, lits, matelas, tableaux padex, Fauteuil agent, Armoire de rangement en bois à 2 portes, Armoire vestiaire en bois, Banc bois avec dossier, Bureau simple avec caisson, Bureau double caisson, Bureau avec retour, Classeur à dossiers suspendus à 4 tiroirs, Tabouret médical, Fauteil ambulatoire, Fauteuil de prélèvement, Chariot de soins, Lampe d\'examen général, Table d\'examen général, Lampe d\'examen gynécologique, Table d\'examen génécologique, Table d\'accouchement, Table de toilette bébé, Marchepied ou Escabeau à 2 marches, Paravents, Table à instruments, Table à pansement, Poubelle avec couvercle et commande au pied, Lampe torche, Réfrigérateur, climatiseur, télévision, etc.',
      categorie: 'MATERIEL',
      sousCategorie: 'BUREAU'
    },
    {
      id: '15',
      ligne: '2419',
      libelle: 'Autres Mobilier et materiel de logement et de bureau (autre qu\'informatique)',
      objetDepense: 'Acquisition de canapés, fauteuils, étagères, meubles TV, portes, tables à manger, armoires de dressing, placards, baignoires, cabines de douche, porte-manteaux, lustres, miroirs, lavabos, toilettes (WC), cuisinières à gaz avec four, etc.',
      categorie: 'MATERIEL',
      sousCategorie: 'LOGEMENT'
    },
    {
      id: '16',
      ligne: '2421',
      libelle: 'Matériel informatique',
      objetDepense: 'Ordinateurs, imprimantes, tables d\'ordinateur, ordinateurs de bureau, ordinateurs portables et tablettes ; serveurs, équipements de réseau ; téléphones IP et équipements de télécommunication ; imprimantes ; consommables et supports ; périphériques et accessoires ; logiciels et licences',
      categorie: 'MATERIEL',
      sousCategorie: 'INFORMATIQUE'
    },
    {
      id: '17',
      ligne: '2422',
      libelle: 'Vidéoprojecteur',
      objetDepense: 'Acquisition de vidéoprojecteurs et accessoires',
      categorie: 'MATERIEL',
      sousCategorie: 'INFORMATIQUE'
    },
    {
      id: '18',
      ligne: '2429',
      libelle: 'Autres Materiels informatiques de bureau',
      objetDepense: 'Souris, claviers, clés USB, mémoire externe, équipements sonores (microphones), unités centrales et/ou leurs composants, webcams, connexions internet, écrans',
      categorie: 'MATERIEL',
      sousCategorie: 'INFORMATIQUE'
    },
    {
      id: '19',
      ligne: '2433',
      libelle: 'Véhicules à 2 roues et tricycles',
      objetDepense: 'Acquisition de motos, vélos, tricycles',
      categorie: 'MATERIEL',
      sousCategorie: 'TRANSPORT'
    },

    // COMPTES DE CHARGES - ACHATS DE BIENS
    {
      id: '20',
      ligne: '',
      libelle: 'COMPTES DE CHARGES',
      objetDepense: '',
      categorie: 'CHARGES',
      isHeader: true
    },
    {
      id: '21',
      ligne: '',
      libelle: 'Achats de biens',
      objetDepense: '',
      categorie: 'CHARGES',
      sousCategorie: 'ACHATS',
      isHeader: true
    },
    {
      id: '22',
      ligne: '',
      libelle: 'Matières, matériels et fournitures',
      objetDepense: '',
      categorie: 'CHARGES',
      sousCategorie: 'FOURNITURES',
      isHeader: true
    },
    {
      id: '23',
      ligne: '2444',
      libelle: 'Matériel bio-médical',
      objetDepense: 'Nébuliseur, Accessoires et consommables spiromètre et débitmètre, Appareils de rééducation respiratoire, Lampe d\'examen, Lampe de lecture et de soins, Lampe loupe, Lunette loupe, Lampe de Wood, Accessoires pour lampe d\'examen, Plafonnier médical, Pied roulant pour lampe loupe, Pied roulant télescopique LID Eckairage, etc.',
      categorie: 'CHARGES',
      sousCategorie: 'MEDICAL'
    },
    {
      id: '24',
      ligne: '6011',
      libelle: 'Achats de petits matériels, fournitures de bureau et documentation',
      objetDepense: 'Stylos, enveloppe, papier rame, crayon, marqueur, bloc note, agenda, gomme, pot de colle, chemise à rabat, chemise cartonnée, classeur, traceuse, etc.',
      categorie: 'CHARGES',
      sousCategorie: 'BUREAU'
    },
    {
      id: '25',
      ligne: '6012',
      libelle: 'Achats de carburants et lubrifiants',
      objetDepense: 'Carburant pour les motos de service et l\'ambulance, groupe électrogène, lampe à pétrole',
      categorie: 'CHARGES',
      sousCategorie: 'CARBURANT'
    },
    {
      id: '26',
      ligne: '6014',
      libelle: 'Achats de fournitures et consommables pour le matériel informatique',
      objetDepense: 'Cartouche d\'encre, souris, câbles, clavier, disque dur, clé USB, clé internet',
      categorie: 'CHARGES',
      sousCategorie: 'INFORMATIQUE'
    },
    {
      id: '27',
      ligne: '6015',
      libelle: 'Achats de petits matériels et fournitures techniques',
      objetDepense: 'Boite de pansement, tensiomètre, ciseaux, registres des consultations, achat de poubelles, râteaux, boîte d\'accouchement, boîte d\'épisiotomie, carnet de consultation, ventilateurs, brasseurs, stethoscope, bouteille de gaz et recharge de gaz',
      categorie: 'CHARGES',
      sousCategorie: 'TECHNIQUE'
    },
    {
      id: '28',
      ligne: '6017',
      libelle: 'Achats d\'habillement (hors personnel)',
      objetDepense: 'Draps (classiques, plastifiés, Alèses jetables médicales, non toisés, spécifiques), rideaux, vêtement de malade',
      categorie: 'CHARGES',
      sousCategorie: 'HABILLEMENT'
    },
    {
      id: '29',
      ligne: '6018',
      libelle: 'Achats de produits pharmaceutiques, médicaux et vétérinaires',
      objetDepense: 'Gants, seringues, Bandes, Coton/compresse, sparadrap, Soins pansements (Bandes de soins, Sets de pansements, Injesctions médicales (Aiguilles médicales, Cathéter/Perfusion, Matériels de prélèvements), Alcool/Sérum, Bistouris et Lames, Gel Echo/Lubrifiant, Protège sondes, Produits vétérinaires (ACTI DOXY 5, ACTI-METHOXINE, ACTI-STRPTO, ACTI-TETRA B) etc.',
      categorie: 'CHARGES',
      sousCategorie: 'PHARMACEUTIQUE'
    },
    {
      id: '30',
      ligne: '6019',
      libelle: 'Autres achats de fournitures, fournitures d\'hygiène et de santé',
      objetDepense: 'Désinfectants environnement (Désinfectants surodorants, Désinfectants de surface, Désinfectants sol, Ligettes désinfectantes). Désinfection instruments (Désinfection à froid, Désinfectants machines, Bacs de décontamination, nettoyants pré-désinfectants). Désinfection nettoyage mains (Gels alcooliques, Distributeurs et supports, Savons doux et crèmes pour les mains). Désinfection linges (Lessives, Assouplissants). Protection médicales (Masques de protection, Surchaussures/Sabots)',
      categorie: 'CHARGES',
      sousCategorie: 'HYGIENE'
    },

    // SERVICES
    {
      id: '31',
      ligne: '6051',
      libelle: 'Branchements et raccordement des compteurs',
      objetDepense: 'Frais de branchement et raccordement de compteur d\'eau Sodeci et électricité CIE',
      categorie: 'SERVICES',
      sousCategorie: 'UTILITAIRES'
    },
    {
      id: '32',
      ligne: '6052',
      libelle: 'Abonnements et consommation d\'eau',
      objetDepense: 'Frais d\'abonnements et consommation eau Sodeci',
      categorie: 'SERVICES',
      sousCategorie: 'UTILITAIRES'
    },
    {
      id: '33',
      ligne: '6053',
      libelle: 'Abonnements et consommation d\'électricité',
      objetDepense: 'Abonnements et consommation électricité CIE',
      categorie: 'SERVICES',
      sousCategorie: 'UTILITAIRES'
    },
    {
      id: '34',
      ligne: '',
      libelle: 'Acquisitions de services',
      objetDepense: '',
      categorie: 'SERVICES',
      isHeader: true
    },
    {
      id: '35',
      ligne: '6111',
      libelle: 'Frais de transport des agents en mission à l\'intérieur',
      objetDepense: 'Frais de transport payés à des agents en mission à l\'intereieur pour le compte du centre de santé',
      categorie: 'SERVICES',
      sousCategorie: 'TRANSPORT'
    },
    {
      id: '36',
      ligne: '6112',
      libelle: 'Indemnités de mission à l\'intérieur',
      objetDepense: 'Frais de mission payé à des agents en mission à l\'interieur',
      categorie: 'SERVICES',
      sousCategorie: 'MISSIONS'
    },
    {
      id: '37',
      ligne: '6123',
      libelle: 'Location machines et matériel technique',
      objetDepense: 'Location de tondeuse, vidéo projecteur, appareil photo, ordinateur etc...',
      categorie: 'SERVICES',
      sousCategorie: 'LOCATION'
    },
    {
      id: '38',
      ligne: '6124',
      libelle: 'Locations de matériel informatique',
      objetDepense: 'Location de serveurs, d\'ordinateurs fixes, d\'ordinateurs portables et tablettes, d\'équipements de réseau (Routeurs, Pare-feu, commutateurs réseau ou switch, Point d\'accès sans fil, répéteur, etc.), de téléphone IP et équipements de télécommunication, d\'imprimantes, de périfériques et accessoires, de logiciels et licences etc.',
      categorie: 'SERVICES',
      sousCategorie: 'LOCATION'
    },
    {
      id: '39',
      ligne: '6127',
      libelle: 'Locations de véhicules',
      objetDepense: 'Location de véhicule pour effectuer des activités, probablement les regulateurs',
      categorie: 'SERVICES',
      sousCategorie: 'LOCATION'
    },
    {
      id: '40',
      ligne: '6129',
      libelle: 'Autres locations',
      objetDepense: 'ci-dessus (ex : location de chaises, bâches, sonorisation pour des activités ponctuelles de vaccination ou de sensibilisation)',
      categorie: 'SERVICES',
      sousCategorie: 'LOCATION'
    },
    {
      id: '41',
      ligne: '6141',
      libelle: 'Entretien des locaux (y compris matériel et founitures d\'entretien)',
      objetDepense: 'Réfection de clôture, fosse à ordures, petite construction, petite réhabilitation, peinture des murs et ouvertures, aménagement de l\'espace, nettoyage des locaux, planting des arbres ou fleurs etc. Fosses à placent, incinérateur, fosse à brûlure',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '42',
      ligne: '6143',
      libelle: 'Entretien des installations électriques, climatiseurs, sanitaires et plomberies',
      objetDepense: 'Maintenance des climatiseurs, travaux de plomberie et d\'électricité',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '43',
      ligne: '6144',
      libelle: 'Entretien et maintenance des mobiliers et matériels informatiques',
      objetDepense: 'Réparation d\'une table d\'ordinateur, installation ou mise à jour des logiciels ou d\'anti - virus. Entretien et maintenance de tout ce qui peut être considéré',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '44',
      ligne: '6146',
      libelle: 'Entretien et maintenance des mobiliers et matériels (sauf informatiques)',
      objetDepense: 'Reparation de tables, lit, chaise, fauteuil, armoire, étagère etc... Entretien et maintenance de tout ce qui peut être considéré comme mobiliers et matériels de bureau et/ou de logement (lignes 2411 et 2419)',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '45',
      ligne: '6147',
      libelle: 'Entretien et réparation des véhicules, pneumatiques',
      objetDepense: 'Vidange, achat de pneu, réparation du véhicule, réparation des tondeuses de la cour',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '46',
      ligne: '6149',
      libelle: 'Autres dépenses d\'entretien et de maintenance',
      objetDepense: 'Reparation de matériels techniques (tables d\'accouchement, tensiomêtre, scanner etc... Tout entretien et maintenance des mobiliers et matériels ne figurant pas les lignes d\'entretien précédentes (6141, 6144, 6146, 6147)',
      categorie: 'SERVICES',
      sousCategorie: 'ENTRETIEN'
    },
    {
      id: '47',
      ligne: '6175',
      libelle: 'Publications',
      objetDepense: 'Frais d\'impression, de parution dans la presse écrite ou audiovisuelle, de mise en vente d\'une œuvre imprimée (journal, livre, etc.)',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '48',
      ligne: '6177',
      libelle: 'Frais de colloque, séminaires, conférences',
      objetDepense: 'Frais de location de la salle de réunion, d\'hébergement des participants, des billets d\'avions des participants, des perdiems ou frais de séjours des participants, de transports des lieux de résidence des participants au lieu de réunion, etc.',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '49',
      ligne: '6181',
      libelle: 'Abonnements et consommations de téléphone, et d\'autres télécommunications',
      objetDepense: 'Rechargement des unités pour la carte SIM: dans le cas de recherche actif des cas, relance téléphone pour les RDV de consultations CPN4, CPON, SP3,PTME',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '50',
      ligne: '6183',
      libelle: 'Abonnements et consommations Internet',
      objetDepense: 'Frais d\'abonnements et consommation internet',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '51',
      ligne: '6184',
      libelle: 'Affanchissement du courrier et autres frais de correspondance',
      objetDepense: 'Frais de Transmission de lettre suite à l\'organisation d\'une stratégie avancée dans les villages',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '52',
      ligne: '6187',
      libelle: 'Communiqués de presse, radio, télévision et frais de publicité',
      objetDepense: 'Panneaux signalétiques, canal horizon, etc.',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '53',
      ligne: '6189',
      libelle: 'Autres dépenses de communication',
      objetDepense: 'les frais de conception des éléments promotionnels (affiches, flyers, plaquettes, kakemono, cadeaux publicitaires, etc.)',
      categorie: 'SERVICES',
      sousCategorie: 'COMMUNICATION'
    },
    {
      id: '54',
      ligne: '',
      libelle: 'Autres services',
      objetDepense: '',
      categorie: 'SERVICES',
      isHeader: true
    },
    {
      id: '55',
      ligne: '6221',
      libelle: 'Rémunérations de prestations extérieures',
      objetDepense: 'Pour Plaidoyer et mobilisation sociale et communautaire, organiser des rencontres d\'échange avec les autorités administratives et leaders communautaires',
      categorie: 'SERVICES',
      sousCategorie: 'PRESTATIONS'
    },
    {
      id: '56',
      ligne: '6222',
      libelle: 'Honoraires et frais annexes',
      objetDepense: 'Honoraires médicaux, honoraires d\'architecte, d\'avocat et/ou conseils juridiques, de géomètre, de notaires, des médecins et dentistes, des paramédicaux',
      categorie: 'SERVICES',
      sousCategorie: 'HONORAIRES'
    },
    {
      id: '57',
      ligne: '6224',
      libelle: 'Frais de formation au profit des tiers',
      objetDepense: '',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '58',
      ligne: '6225',
      libelle: 'Services extérieurs de gardiennage',
      objetDepense: 'Service de gardiennage',
      categorie: 'SERVICES',
      sousCategorie: 'SECURITE'
    },
    {
      id: '59',
      ligne: '6227',
      libelle: 'Frais d\'audit et contrôle',
      objetDepense: 'Frais de préparation de l\'audit (apprêter les documents à mettre à la disposition des auditeurs) Honoraires des auditeurs à la charges de offre de soins au centre de santé, offre de soins en stratégie avancée, offre de soins de santé en activité foraine, activités de masse',
      categorie: 'SERVICES',
      sousCategorie: 'AUDIT'
    },
    {
      id: '60',
      ligne: '6229',
      libelle: 'Autres prestations de services',
      objetDepense: '',
      categorie: 'SERVICES',
      sousCategorie: 'PRESTATIONS'
    },
    {
      id: '61',
      ligne: '6231',
      libelle: 'Prestation des organismes de formation résidents',
      objetDepense: '',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '62',
      ligne: '6235',
      libelle: 'Indemnités de formation à l\'intérieur',
      objetDepense: 'Frais de déplacement pour formation, réunion loin du district de santé',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '63',
      ligne: '6236',
      libelle: 'Transport des agents en formation à l\'intérieur',
      objetDepense: 'Frais de déplacement pour réunion et formation d\'un agent hors de son aire de santé',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '64',
      ligne: '6239',
      libelle: 'Autres frais de formation du personnel',
      objetDepense: 'Frais d\'impression/reprographie des documents devant servir à la formation, achat des kits participants (blocs notes, stylos, crayons, gommes, chemises à...)',
      categorie: 'SERVICES',
      sousCategorie: 'FORMATION'
    },
    {
      id: '65',
      ligne: '6292',
      libelle: 'Frais de réception, de fêtes et de cérémonies',
      objetDepense: 'Consultation foraine, organisation de cérémonie, fêtes de fin d\'année, réunion Coges, AG de validation de Plan d\'Affaires etc...',
      categorie: 'SERVICES',
      sousCategorie: 'EVENEMENTS'
    },
    {
      id: '66',
      ligne: '6295',
      libelle: 'Actions et interventions urgentes',
      objetDepense: '',
      categorie: 'SERVICES',
      sousCategorie: 'URGENCES'
    },

    // CHARGES DE PERSONNEL
    {
      id: '67',
      ligne: '',
      libelle: 'Charges de personnel',
      objetDepense: '',
      categorie: 'PERSONNEL',
      isHeader: true
    },
    {
      id: '68',
      ligne: '6621',
      libelle: 'Rémunérations du personnel sous contrat et des décisionnaires',
      objetDepense: 'Paiement salaire du personnel non fonctionnaire',
      categorie: 'PERSONNEL',
      sousCategorie: 'SALAIRES'
    },
    {
      id: '69',
      ligne: '6622',
      libelle: 'Rémunérations du personnel occasionnel',
      objetDepense: 'Paiement du salaire du personnel occasionnel, aide-soignant, IDE, sage-femme diplomée d\'état, technicien/supérieur de laboratoire, medecin etc...',
      categorie: 'PERSONNEL',
      sousCategorie: 'SALAIRES'
    },
    {
      id: '70',
      ligne: '6639',
      libelle: 'Autres primes et indemnités (primes des subsides)',
      objetDepense: 'Paiement des primes trimestrielles et autres indemnités',
      categorie: 'PERSONNEL',
      sousCategorie: 'PRIMES'
    },
    {
      id: '71',
      ligne: '6643',
      libelle: 'Cotisations CNPS des agents contractuels et décisionnaires',
      objetDepense: 'Frais de cotisation CNPS des agents contractuels et le personnel non fonctionnaire',
      categorie: 'PERSONNEL',
      sousCategorie: 'COTISATIONS'
    },
    {
      id: '72',
      ligne: '6652',
      libelle: 'Frais d\'habillement du personnel',
      objetDepense: 'Achat de blouses, pantalon, chaussures, chapeaux pour le personnel',
      categorie: 'PERSONNEL',
      sousCategorie: 'HABILLEMENT'
    },
    {
      id: '73',
      ligne: '6717',
      libelle: 'Intérêts et frais financiers',
      objetDepense: 'Commissions sur virements à l\'endroit des fournisseurs ou des bénéficiaires de primes, intérêts périodiques prélévés sur le compte (agios)',
      categorie: 'PERSONNEL',
      sousCategorie: 'FINANCIERS'
    }
  ];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const baseEnv = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const buildUrl = (b: string) => `${b.replace(/\/$/, '')}/nbe?page=1&pageSize=1000&sort=ligne&dir=asc`;

        // 1st try: as provided
        let resp = await fetch(buildUrl(baseEnv), { headers: { 'Content-Type': 'application/json' } });
        // If 404 and base lacks '/api', retry with '/api'
        if (resp.status === 404 && !/\/(api)(\/)?$/i.test(baseEnv)) {
          const withApi = baseEnv.replace(/\/$/, '') + '/api';
          resp = await fetch(buildUrl(withApi), { headers: { 'Content-Type': 'application/json' } });
        }
        if (!resp.ok) throw new Error(`NBE fetch failed: ${resp.status}`);
        const json = await resp.json();
        const items: NBELine[] = json?.items || [];
        if (!cancelled && items.length > 0) {
          setNbeLines(items);
          setFilteredLines(items);
          setDataSource('api');
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn('NBE API error, fallback to mock:', e);
      }

      // Fallback aux données mock si API vide/erreur
      if (!cancelled) {
        setNbeLines(sampleData);
        setFilteredLines(sampleData);
        setDataSource('mock');
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let filtered = nbeLines;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(line => {
        const l1 = (line.ligne || '').toLowerCase();
        const l2 = (line.libelle || '').toLowerCase();
        const l3 = (line.objetDepense || '').toLowerCase();
        const q = searchTerm.toLowerCase();
        return l1.includes(q) || l2.includes(q) || l3.includes(q);
      });
    }

    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(line => line.categorie === selectedCategory);
    }

    setFilteredLines(filtered);
  }, [nbeLines, searchTerm, selectedCategory]);

  const handleSort = (field: keyof NBELine) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getCategoryIcon = (categorie: string) => {
    switch (categorie) {
      case 'IMMOBILISATIONS': return <Building2 className="w-4 h-4" />;
      case 'SOLS': return <Shield className="w-4 h-4" />;
      case 'IMMEUBLES': return <Building2 className="w-4 h-4" />;
      case 'MATERIEL': return <Wrench className="w-4 h-4" />;
      case 'CHARGES': return <Droplets className="w-4 h-4" />;
      case 'SERVICES': return <Activity className="w-4 h-4" />;
      case 'PERSONNEL': return <Users className="w-4 h-4" />;
      default: return <Building2 className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (categorie: string) => {
    switch (categorie) {
      case 'IMMOBILISATIONS': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SOLS': return 'bg-green-100 text-green-800 border-green-200';
      case 'IMMEUBLES': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MATERIEL': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CHARGES': return 'bg-red-100 text-red-800 border-red-200';
      case 'SERVICES': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'PERSONNEL': return 'bg-pink-100 text-pink-800 border-pink-200';
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
      {/* Indicateur de source (prominent) */}
      <div className={`flex items-center justify-between text-sm rounded-md border p-3 ${
        dataSource === 'api'
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="font-medium">
          Source des données NBE: {dataSource === 'api' ? 'API (base de données)' : 'Mock (fallback)'}
        </div>
        <div className="opacity-80">
          {dataSource === 'api' ? 'Chargé depuis le backend' : 'Chargé localement car API vide/indisponible'}
        </div>
      </div>

      {/* Filtres et contrôles */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher une ligne NBE..."
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
            <option value="IMMOBILISATIONS">Immobilisations</option>
            <option value="SOLS">Sols et aménagements</option>
            <option value="IMMEUBLES">Immeubles</option>
            <option value="MATERIEL">Matériel et mobilier</option>
            <option value="CHARGES">Charges - Achats de biens</option>
            <option value="SERVICES">Services</option>
            <option value="PERSONNEL">Charges de personnel</option>
          </select>
        </div>

        <div className="flex gap-3 items-center">
          <span className={`px-2 py-0.5 rounded border text-xs ${
            dataSource === 'api'
              ? 'bg-green-100 text-green-800 border-green-200'
              : 'bg-amber-100 text-amber-800 border-amber-200'
          }`}>
            Source: {dataSource === 'api' ? 'API' : 'Mock'}
          </span>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Sommaire cliquable des sections */}
      {nbeLines.some((l) => l.isHeader) && (
        <div className="flex flex-wrap gap-2 p-2 bg-white rounded-md border border-slate-200">
          {nbeLines.filter((l) => l.isHeader && l.libelle).map((h) => {
            const slug = makeSlug(h.libelle);
            return (
              <button
                key={h.id}
                onClick={() => {
                  const el = sectionRefs.current[slug];
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`px-3 py-1 text-xs rounded border ${getSectionColor(h.libelle)}`}
                title={h.libelle}
              >
                {h.libelle}
              </button>
            );
          })}
        </div>
      )}

      {/* Tableau NBE */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th 
                className="text-left p-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 w-20"
                onClick={() => handleSort('ligne')}
              >
                <div className="flex items-center gap-2">
                  LIGNE
                  {sortField === 'ligne' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th 
                className="text-left p-4 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('libelle')}
              >
                <div className="flex items-center gap-2">
                  LIBELLÉ
                  {sortField === 'libelle' && (
                    sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </th>
              <th className="text-left p-4 font-semibold text-slate-700">
                OBJET DE LA DÉPENSE (LISTE NON EXHAUSTIVE)
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLines.map((line) => (
              line.isHeader ? (
                <tr
                  key={line.id}
                  ref={(el) => {
                    const slug = makeSlug(line.libelle || 'section');
                    sectionRefs.current[slug] = el;
                  }}
                  className={`border-b border-slate-200 ${getSectionColor(line.libelle || '')}`}
                >
                  <td className="p-3" colSpan={3}>
                    <div className="font-semibold tracking-wide uppercase">{line.libelle}</div>
                  </td>
                </tr>
              ) : (
                <tr key={line.id} className={`border-b border-slate-100 hover:bg-slate-50 ${line.isHighlighted ? 'bg-yellow-50' : ''}`}>
                  <td className="p-4">
                    <div className="font-mono text-sm font-medium text-blue-600">
                      {line.ligne}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-slate-700">
                      {line.libelle}
                    </div>
                    {line.sousCategorie && (
                      <div className="text-sm text-slate-500 mt-1">
                        <Badge className={`${getCategoryColor(line.categorie)} border text-xs`}>
                          {line.sousCategorie.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    {line.objetDepense ? (
                      <div className="text-sm text-slate-600 leading-relaxed">
                        {line.objetDepense}
                      </div>
                    ) : (
                      <div className="text-slate-400 text-sm italic">Non spécifié</div>
                    )}
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center text-sm text-slate-600">
        <div>
          Affichage de {filteredLines.length} ligne(s) sur {nbeLines.length}
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>NBE officielle</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded border text-xs ${
              dataSource === 'api'
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-amber-100 text-amber-800 border-amber-200'
            }`}>
              Source: {dataSource === 'api' ? 'API' : 'Mock'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
