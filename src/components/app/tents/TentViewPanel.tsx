import { stateColors } from "@/components/app/dashboard/StateChart"
import { useModalContext } from "@/components/hooks/useModalContext"
import Button from "@/components/ui/Button"
import type { Tent } from "@/pages/tentes"
import { trpc } from "@/utils/trpc"
import { UIProps } from "@/utils/typedProps"
import Head from "next/head"
import Link from "next/link"
import { FC, useState } from "react"
import { toast } from "react-hot-toast"
import TentCharacteristic from "./TentCharacteristic"
import TentDeletePanel from "./TentDeletePanel"
import TentUpdatePanel from "./TentUpdatePanel"

const unitLabels: Record<string, string> = {
  FARFADETS: "Farfadets",
  JEANNETTES: "Jeannettes",
  LOUVETEAUX: "Louveteaux",
  GUIDES: "Guides",
  SCOUTS: "Scouts",
  PIONNIERS: "Pionniers",
  CARAVELLES: "Caravelles",
  COMPAGNONS: "Compagnons",
  RESPONSABLES: "Responsables",
  GROUPE: "Groupe",
}

const MISSING_LABELS: Record<string, string> = {
  zip: "Zip",
  faitiere: "Faitière",
  doubleToit: "Double toit",
  toile: "Toile de tente",
  tapis: "Tapis de sol",
  sardines: "Sardines",
  sacTente: "Sac de tentes",
}

function parseMissingItems(comments: string | null | undefined): Record<string, boolean> {
  if (!comments) return {}
  try {
    const parsed = JSON.parse(comments)
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) return parsed as Record<string, boolean>
  } catch { /* not JSON */ }
  return {}
}

const TentViewPanel: FC<UIProps<{ tent: Tent }>> = ({ tent }) => {
  const { setModal } = useModalContext()
  const { data: loans, refetch: refetchLoans } = trpc.loans.getByTent.useQuery(tent.id)
  const createLoanMutation = trpc.loans.create.useMutation({
    onSuccess: () => {
      toast.success("Emprunt enregistré !")
      refetchLoans()
      setShowLoanForm(false)
      setSelectedUnit("")
      setNote("")
    },
  })
  const returnMutation = trpc.loans.return.useMutation({
    onSuccess: () => {
      toast.success("Retour enregistré")
      refetchLoans()
    },
  })

  const [showLoanForm, setShowLoanForm] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [note, setNote] = useState("")

  const { id, identifyingLabel, size, state, type, integrated, complete, pegs, comments, updatedAt, createdAt } = tent

  const activeLoan = loans?.find((l) => !l.returnedAt)

  const missingItems = parseMissingItems(comments)
  const missingKeys = Object.entries(missingItems).filter(([, v]) => v).map(([k]) => k)
  const hasRealComment = comments && (() => { try { JSON.parse(comments); return false } catch { return true } })()

  const isProblematic = !complete || state === "EN_REPARATION"

  const goToDeletePanel = () => setModal({ visible: true, component: <TentDeletePanel tent={tent} /> })
  const goToUpdatePanel = () => setModal({ visible: true, component: <TentUpdatePanel tent={tent} /> })

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_URL ?? ""}/tente/${id}`

  return (
    <>
      <Head><title>{`Tente ${identifyingLabel} | MonMatos`}</title></Head>
      <div className="mx-auto max-w-[450px] space-y-6 py-4">
        <div className={`mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 ${
          isProblematic ? "border-red-500" : "border-slate-800"
        }`}>
          <h2 className={`max-w-[100px] break-words text-center text-xl font-bold leading-tight ${
            isProblematic ? "text-red-600" : ""
          }`}>
            {identifyingLabel}
          </h2>
        </div>

        {isProblematic && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-semibold text-red-700">
              {state === "EN_REPARATION" ? "🔧 En réparation" : ""}
              {!complete && state !== "EN_REPARATION" ? "⚠️ Tente incomplète" : ""}
              {state === "EN_REPARATION" && !complete ? " · Incomplète" : ""}
            </p>
            {missingKeys.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {missingKeys.map((k) => (
                  <span key={k} className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-xs font-semibold text-red-700">
                    ⚠️ {MISSING_LABELS[k] ?? k}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
          <Button type="button" onClick={goToUpdatePanel} size="sm" icon="HiPencil" className="max-w-fit">Modifier</Button>
          <Link
            href={`/ce-qui-manque?t=${id}`}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            📋 Ce qui manque
          </Link>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            🔗 Page publique
          </a>
        </div>

        <div>
          <p className="text-lg font-bold">Informations</p>
          <p>{createdAt >= updatedAt ? `Créée le ${createdAt.toLocaleDateString()}` : `Modifiée le ${updatedAt.toLocaleDateString()}`}</p>
        </div>

        <div className="space-y-2">
          <TentCharacteristic type="size" label="TAILLE" value={`${size} place${size > 1 ? "s" : ""}`} />
          <TentCharacteristic type="state" label="ÉTAT" value={state} variants={stateColors} />
          <TentCharacteristic label="Complète ?" value={complete ? "OUI" : "NON"} />
          <TentCharacteristic type="type" label="TYPE" value={type.toUpperCase()} />
          <TentCharacteristic label="Tapis de sol" value={integrated ? "INTÉGRÉ" : "NORMAL"} />
          <TentCharacteristic label="Sardines" value={`${pegs ?? 0} sardine${(pegs ?? 0) > 1 ? "s" : ""}`} />
          {activeLoan && (
            <TentCharacteristic label="Emprunté par" value={unitLabels[activeLoan.borrower] ?? activeLoan.borrower} />
          )}
          {hasRealComment && (
            <p className="py-2 italic">{`Commentaire: "${comments}"`}</p>
          )}
          {!hasRealComment && !comments && (
            <p className="py-2 text-slate-400 italic">Pas encore de commentaire ...</p>
          )}
        </div>

        {/* Loan management */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-slate-700">Gestion des emprunts</p>
            {activeLoan && (
              <button
                onClick={() => returnMutation.mutate(tent.id)}
                className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
                disabled={returnMutation.isLoading}
              >
                Marquer retourné
              </button>
            )}
          </div>
          {!showLoanForm ? (
            <button
              onClick={() => setShowLoanForm(true)}
              className="w-full rounded-lg border border-dashed border-emerald-400 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
            >
              + Nouvelle sortie
            </button>
          ) : (
            <div className="space-y-3">
              <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none">
                <option value="">— Choisir une unité —</option>
                {Object.entries(unitLabels).map(([key, lbl]) => <option key={key} value={key}>{lbl}</option>)}
              </select>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optionnel)" className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowLoanForm(false)} className="flex-1 rounded-lg border py-2 text-sm">Annuler</button>
                <button
                  disabled={!selectedUnit || createLoanMutation.isLoading}
                  onClick={() => createLoanMutation.mutate({ tentId: id, borrower: selectedUnit, note: note || undefined })}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Confirmer
                </button>
              </div>
            </div>
          )}
          {loans && loans.length > 0 && (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Historique</p>
              <ol className="space-y-1.5">
                {loans.slice(0, 8).map((loan) => (
                  <li key={loan.id} className="flex items-start gap-2 text-xs">
                    <span className="mt-0.5 text-slate-400">{loan.returnedAt ? "✓" : "→"}</span>
                    <div>
                      <span className="font-semibold text-slate-700">{unitLabels[loan.borrower] ?? loan.borrower}</span>
                      <span className="ml-1 text-slate-400">
                        {new Date(loan.loanedAt).toLocaleDateString("fr-FR")}
                        {loan.returnedAt ? ` → ${new Date(loan.returnedAt).toLocaleDateString("fr-FR")}` : " — en cours"}
                      </span>
                      {loan.note && <span className="ml-1 italic text-slate-400">({loan.note})</span>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <Button type="button" onClick={goToDeletePanel} size="sm" variant="red" icon="HiTrash" className="ml-auto max-w-fit">Supprimer</Button>
      </div>
    </>
  )
}

export default TentViewPanel
