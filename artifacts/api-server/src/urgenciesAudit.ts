/**
 * Inventaire de l'ancienne liste d'urgences, conservé séparément des
 * contacts publiés. La présence d'une fiche dans cet inventaire ne vaut pas
 * validation de son numéro ou de son adresse.
 */
export const LEGACY_URGENCIES_AUDIT = {
  snapshotDate: "2026-09-17",
  sourceFile: ".migration-backup/server/urgenciesService.ts",
  snapshotCount: 113,
  publishedPriorityCount: 7,
  pendingVerificationCount: 106,
  localPendingCount: 102,
  localSecurityCount: 44,
  localByType: {
    Police: 25,
    Gendarmerie: 19,
    Pompiers: 10,
    Hôpitaux: 22,
    Ambulance: 3,
    "Services sociaux": 12,
    ONG: 9,
    "Croix-Rouge": 2,
  },
  localByCity: {
    Ouagadougou: 42,
    "Bobo-Dioulasso": 10,
    Koudougou: 5,
    Ouahigouya: 5,
    Kaya: 5,
    "Fada N'Gourma": 4,
    Dori: 4,
    Manga: 3,
    Gaoua: 3,
    Dédougou: 3,
    Ziniaré: 3,
    Banfora: 3,
    Tenkodogo: 3,
    Kongoussi: 2,
    Boulsa: 2,
    Pô: 2,
    Léo: 2,
    Sapouy: 1,
  },
  duplicatePhoneGroups: [
    { phone: "25308500", ids: ["oua-gen-2", "gen-4"] },
    { phone: "20970018", ids: ["bob-pom-1", "pom-add-1"] },
    { phone: "24550200", ids: ["oua2-hop-1", "soc-8"] },
    { phone: "25306000", ids: ["ong-6", "oua-pol-10"] },
  ],
  reusedAddressGroups: [
    {
      address: "Avenue de l'Indépendance",
      ids: ["oua-pol-2", "oua-hop-1", "kou-pol-1", "oua-pol-10"],
    },
    {
      address: "Secteur 30, Route de Kaya",
      ids: ["oua-pol-3", "oua-hop-5"],
    },
    {
      address: "Avenue Charles de Gaulle",
      ids: ["oua-gen-2", "oua-pom-1", "oua-hop-3"],
    },
    {
      address: "Avenue de la République",
      ids: ["bob-pol-1", "ong-2"],
    },
    {
      address: "Route de Ouagadougou",
      ids: ["kou-hop-1", "oua2-gen-1", "kay-gen-1", "ded-hop-1"],
    },
    {
      address: "Avenue Centrale",
      ids: ["oua2-pol-1", "kay-pol-1", "zin-pol-1"],
    },
    {
      address: "Avenue Principale",
      ids: ["fad-pol-1", "man-pol-1", "ded-pol-1", "ban-pol-1"],
    },
    {
      address: "Centre-ville",
      ids: ["dor-pol-1", "gao-pol-1"],
    },
    {
      address: "Quartier Hospitalier",
      ids: ["dor-hop-1", "man-hop-1", "gao-hop-1", "zin-hop-1"],
    },
    {
      address: "Koulouba",
      ids: ["soc-1", "soc-11"],
    },
  ],
  suspiciousPhoneCount: 0,
} as const;