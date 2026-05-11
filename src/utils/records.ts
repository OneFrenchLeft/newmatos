import { Group, Unit } from "@prisma/client"

// Unités mixtes : Louveteau+Jeannette → LOUVETEAUX_JEANNETTES, Scout+Guide → SCOUTS_GUIDES, Pionnier+Caravelle → PIONNIERS_CARAVELLES
export const units: Record<Group["movement"], Partial<Record<Unit, string>>> = {
  SGDF: {
    FARFADETS: "Farfadets",
    LOUVETEAUX_JEANNETTES: "Louveteaux / Jeannettes",
    SCOUTS_GUIDES: "Scouts / Guides",
    PIONNIERS_CARAVELLES: "Pionniers / Caravelles",
    COMPAGNONS: "Compagnons",
    GROUPE: "Non attribuée",
  },
  AGSE: {
    LOUVETEAUX_JEANNETTES: "Louveteaux / Louvettes",
    SCOUTS_GUIDES: "Éclaireurs / Éclaireuses",
    PIONNIERS_CARAVELLES: "Équipiers / Équipières",
    GROUPE: "Non attribuée",
  },
  SUF: {
    LOUVETEAUX_JEANNETTES: "Louveteaux / Jeannettes",
    SCOUTS_GUIDES: "Éclaireurs / Guides",
    PIONNIERS_CARAVELLES: "Routiers / Guides-Aînées",
    GROUPE: "Non attribuée",
  },
  EEUDF: {
    LOUVETEAUX_JEANNETTES: "Louveteaux / Louvettes",
    SCOUTS_GUIDES: "Éclaireurs / Éclaireuses",
    PIONNIERS_CARAVELLES: "Aînés / Aînées",
    RESPONSABLES: "Responsables",
    GROUPE: "Non attribuée",
  },
  EEDF: {
    LOUVETEAUX_JEANNETTES: "Louveteaux / Louvettes",
    SCOUTS_GUIDES: "Éclaireurs / Éclaireuses",
    PIONNIERS_CARAVELLES: "Aînés / Aînées",
    GROUPE: "Non attribuée",
  },
  EEIDF: {
    SCOUTS_GUIDES: "Éclaireurs / Éclaireuses",
    PIONNIERS_CARAVELLES: "Perspectives",
    GROUPE: "Non attribuée",
  },
  SGDFM: {
    FARFADETS: "Farfadets",
    LOUVETEAUX_JEANNETTES: "Moussaillons / Mousses",
    SCOUTS_GUIDES: "Marins",
    COMPAGNONS: "Compagnons",
    RESPONSABLES: "Responsables",
    GROUPE: "Non attribuée",
  },
}

export const movements: Record<Group["movement"], string> = {
  SGDF: "Scouts et Guides de France",
  SGDFM: "Scouts et Guides de France Marins",
  SUF: "Scouts unitaire de France",
  AGSE: "Association des Guides et Scouts d'Europe",
  EEUDF: "Éclaireuses et Éclaireurs unionistes de France",
  EEDF: "Éclaireuses et Éclaireurs de France",
  EEIDF: "Éclaireuses et Éclaireurs Israélites de France",
}
