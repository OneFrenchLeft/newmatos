import { Group, Tent } from "@prisma/client"
import * as xlsx from "xlsx"

export const downloadImageFromCanvas = (id: string, filename: string) => {
  const canvas = document.getElementById(id) as HTMLCanvasElement
  const pngUrl = (canvas as HTMLCanvasElement)
    .toDataURL("image/png")
    .replace("image/png", "image/octet-stream")
  const downloadLink = document.createElement("a")
  downloadLink.href = pngUrl
  downloadLink.download = `${filename}.png`
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}

type RepairTask = {
  id: string
  description: string
  assignedTo: string
  done: boolean
}

type TentWithMissing = Tent & {
  missingItems?: {
    zip?: boolean
    faitiere?: boolean
    doubleToit?: boolean
    toile?: boolean
    tapis?: boolean
    sardines?: boolean
    sacTente?: boolean
  }
  loans?: Array<{
    borrower: string
    loanedAt: Date | string
    returnedAt?: Date | string | null
    note?: string | null
  }>
  repairTasks?: RepairTask[]
}

const stateLabels: Record<string, string> = {
  NEUF: "Neuf",
  BON: "Bon",
  EN_REPARATION: "En réparation",
  MAUVAIS: "Mauvais",
  INUTILISABLE: "Inutilisable",
}

const unitMixteLabels: Record<string, string> = {
  FARFADETS: "Farfadets",
  LOUVETEAUX_JEANNETTES: "Louveteaux / Jeannettes",
  SCOUTS_GUIDES: "Scouts / Guides",
  PIONNIERS_CARAVELLES: "Pionniers / Caravelles",
  COMPAGNONS: "Compagnons",
  RESPONSABLES: "Responsables",
  GROUPE: "Non attribuée",
}

export const downloadExcel = (
  tents: TentWithMissing[],
  _movementName: Group["movement"],
) => {
  const handleExport = async () => {
    const formatedTents = tents.map((tent) => {
      const missing = tent.missingItems ?? {}
      const activeLoans = (tent.loans ?? []).filter((l) => !l.returnedAt)
      const allLoans = tent.loans ?? []

      return {
        ["Identifiant"]: tent.identifyingLabel ?? tent.identifyingNum,
        ["Taille"]: tent.size,
        ["Type"]: tent.type,
        ["Tapis de sol"]: tent.integrated ? "OUI" : "NON",
        ["État"]: stateLabels[tent.state] ?? tent.state,
        ["Complète"]: tent.complete ? "OUI" : "NON",
        ["Sardines"]: tent.pegs ?? 0,
        ["Commentaires"]: tent.comments ?? "",
        // Ce qui manque
        ["Manque: Zip"]: missing.zip ? "OUI" : "NON",
        ["Manque: Faitière"]: missing.faitiere ? "OUI" : "NON",
        ["Manque: Double toit"]: missing.doubleToit ? "OUI" : "NON",
        ["Manque: Toile de tente"]: missing.toile ? "OUI" : "NON",
        ["Manque: Tapis de sol"]: missing.tapis ? "OUI" : "NON",
        ["Manque: Sardines"]: missing.sardines ? "OUI" : "NON",
        ["Manque: Sac de tentes"]: missing.sacTente ? "OUI" : "NON",
        // Emprunt actif
        ["Empruntée par"]: activeLoans.length > 0
          ? (unitMixteLabels[activeLoans[0]!.borrower] ?? activeLoans[0]!.borrower)
          : "",
        // Historique emprunts (résumé)
        ["Nb emprunts total"]: allLoans.length,
        ["Historique emprunts"]: allLoans
          .map((l) => {
            const date = new Date(l.loanedAt).toLocaleDateString("fr-FR")
            const retour = l.returnedAt
              ? new Date(l.returnedAt).toLocaleDateString("fr-FR")
              : "en cours"
            const borrowerLabel = unitMixteLabels[l.borrower] ?? l.borrower
            return `${borrowerLabel} (${date}→${retour})${l.note ? ` [${l.note}]` : ""}`
          })
          .join(" | "),
      }
    })

    const wb = xlsx.utils.book_new()

    // Feuille principale GLOBAL
    const ws = xlsx.utils.json_to_sheet(formatedTents)
    xlsx.utils.book_append_sheet(wb, ws, "GLOBAL")

    // Feuille RÉPARATIONS — une ligne par tâche de réparation
    const repairTents = tents.filter((t) => t.state === "EN_REPARATION")
    if (repairTents.length > 0) {
      const repairRows: Record<string, string | number>[] = []
      for (const tent of repairTents) {
        const tasks = tent.repairTasks ?? []
        if (tasks.length === 0) {
          repairRows.push({
            ["Identifiant"]: tent.identifyingLabel ?? "",
            ["Taille"]: tent.size,
            ["Type"]: tent.type,
            ["État"]: stateLabels[tent.state] ?? tent.state,
            ["Tâche"]: "",
            ["Statut tâche"]: "",
            ["Personne en charge"]: "",
          })
        } else {
          for (const task of tasks) {
            repairRows.push({
              ["Identifiant"]: tent.identifyingLabel ?? "",
              ["Taille"]: tent.size,
              ["Type"]: tent.type,
              ["État"]: stateLabels[tent.state] ?? tent.state,
              ["Tâche"]: task.description,
              ["Statut tâche"]: task.done ? "Effectuée" : "À faire",
              ["Personne en charge"]: task.assignedTo ?? "",
            })
          }
        }
      }
      const wsRepair = xlsx.utils.json_to_sheet(repairRows)
      xlsx.utils.book_append_sheet(wb, wsRepair, "RÉPARATIONS")
    }

    xlsx.writeFile(wb, "Tentes.xlsx")
  }

  return handleExport
}

// Import XLSX — accepte uniquement un fichier au format identique à l'export
export type ImportedTent = {
  identifyingLabel: string
  size: number
  type: string
  integrated: boolean
  state: string
  complete: boolean
  pegs: number
  comments: string
}

const REQUIRED_COLUMNS = [
  "Identifiant",
  "Taille",
  "Type",
  "Tapis de sol",
  "État",
  "Complète",
  "Sardines",
]

const stateReverseLabels: Record<string, string> = {
  "Neuf": "NEUF",
  "Bon": "BON",
  "En réparation": "EN_REPARATION",
  "Mauvais": "MAUVAIS",
  "Inutilisable": "INUTILISABLE",
}

export const parseImportedExcel = (
  file: File,
): Promise<ImportedTent[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = xlsx.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) return reject(new Error("Fichier vide"))
        const sheet = workbook.Sheets[sheetName]
        if (!sheet) return reject(new Error("Feuille introuvable"))
        const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet)

        if (rows.length === 0) return reject(new Error("Aucune donnée trouvée dans le fichier"))

        // Validate columns
        const firstRow = rows[0]!
        const missingCols = REQUIRED_COLUMNS.filter((col) => !(col in firstRow))
        if (missingCols.length > 0) {
          return reject(
            new Error(
              `Format de fichier invalide. Colonnes manquantes : ${missingCols.join(", ")}. Veuillez utiliser un fichier exporté depuis MonMatos.`,
            ),
          )
        }

        const tents: ImportedTent[] = rows.map((row, i) => {
          const label = String(row["Identifiant"] ?? "")
          if (!label) throw new Error(`Ligne ${i + 2} : identifiant manquant`)
          const rawState = String(row["État"] ?? "")
          const state = stateReverseLabels[rawState] ?? rawState
          return {
            identifyingLabel: label,
            size: Number(row["Taille"]) || 0,
            type: String(row["Type"] ?? "CANADIENNE").toUpperCase(),
            integrated: String(row["Tapis de sol"]).toUpperCase() === "OUI",
            state,
            complete: String(row["Complète"]).toUpperCase() === "OUI",
            pegs: Number(row["Sardines"]) || 0,
            comments: String(row["Commentaires"] ?? ""),
          }
        })

        resolve(tents)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"))
    reader.readAsArrayBuffer(file)
  })
}
