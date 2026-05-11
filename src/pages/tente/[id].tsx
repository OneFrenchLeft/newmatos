import { trpc } from "@/utils/trpc"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import { QRCodeCanvas } from "qrcode.react"
import { useState } from "react"
import { toast } from "react-hot-toast"

const unitLabels: Record<string, string> = {
  FARFADETS: "Farfadets",
  LOUVETEAUX_JEANNETTES: "Louveteaux / Jeannettes",
  SCOUTS_GUIDES: "Scouts / Guides",
  PIONNIERS_CARAVELLES: "Pionniers / Caravelles",
  COMPAGNONS: "Compagnons",
  RESPONSABLES: "Responsables",
  GROUPE: "Non attribuée",
  LOUVETEAUX: "Louveteaux",
  JEANNETTES: "Jeannettes",
  SCOUTS: "Scouts",
  GUIDES: "Guides",
  PIONNIERS: "Pionniers",
  CARAVELLES: "Caravelles",
}

const stateLabels: Record<string, string> = {
  NEUF: "Neuf",
  BON: "Bon",
  EN_REPARATION: "En réparation",
  MAUVAIS: "Mauvais",
  INUTILISABLE: "Inutilisable",
}

const stateColors: Record<string, string> = {
  NEUF: "bg-emerald-500",
  BON: "bg-blue-500",
  EN_REPARATION: "bg-red-500",
  MAUVAIS: "bg-amber-500",
  INUTILISABLE: "bg-red-700",
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

export default function PublicTentPage() {
  const router = useRouter()
  const tentId = typeof router.query.id === "string" ? router.query.id : ""

  const { data: tent, isLoading, refetch } = trpc.tents.getPublic.useQuery(tentId, {
    enabled: !!tentId,
  })

  const { data: loans, refetch: refetchLoans } = trpc.loans.getPublicHistory.useQuery(tentId, {
    enabled: !!tentId,
  })

  const reportRepairMutation = trpc.tents.update.useMutation({
    onSuccess: () => {
      toast.success("Tente signalée en réparation !")
      refetch()
    },
    onError: () => toast.error("Erreur lors du signalement"),
  })

  const createLoanMutation = trpc.loans.create.useMutation({
    onSuccess: () => {
      toast.success("Emprunt enregistré !")
      refetch()
      refetchLoans()
      setSelectedUnit("")
      setNote("")
      setShowLoanForm(false)
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  })

  const [showLoanForm, setShowLoanForm] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState("")
  const [note, setNote] = useState("")
  const [showRepairConfirm, setShowRepairConfirm] = useState(false)

  const pageUrl = typeof window !== "undefined" ? window.location.href : ""

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-slate-500">Chargement ...</p>
        </div>
      </div>
    )
  }

  if (!tent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <h1 className="text-2xl font-bold text-slate-800">Tente introuvable</h1>
        <p className="text-slate-500">Ce QR code ne correspond à aucune tente enregistrée.</p>
      </div>
    )
  }

  const isProblematic = !tent.complete || tent.state === "EN_REPARATION"
  const activeLoan = loans?.find((l) => !l.returnedAt)
  const loanHistory = loans ?? []
  const missingItems = parseMissingItems(tent.comments)
  const missingKeys = Object.entries(missingItems).filter(([, v]) => v).map(([k]) => k)
  const hasRealComment = tent.comments && (() => { try { JSON.parse(tent.comments!); return false } catch { return true } })()

  return (
    <div className={`min-h-screen px-4 py-8 ${isProblematic ? "bg-red-50" : "bg-slate-50"}`}>
      <Head>
        <title>Tente {tent.identifyingLabel ?? tent.identifyingNum} — {tent.group?.name ?? "MonMatos"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className={`rounded-2xl p-6 shadow-sm ${isProblematic ? "bg-red-100 border border-red-300" : "bg-white"}`}>
          <div className="flex items-center gap-5">
            <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4 text-lg font-bold ${
              isProblematic ? "border-red-500 text-red-600" : "border-slate-800 text-slate-800"
            }`}>
              {tent.identifyingLabel ?? tent.identifyingNum}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{tent.group?.name}</p>
              <h1 className={`text-2xl font-bold ${isProblematic ? "text-red-700" : "text-slate-800"}`}>
                Tente {tent.identifyingLabel ?? tent.identifyingNum}
              </h1>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white ${stateColors[tent.state] ?? "bg-slate-400"}`}>
                {stateLabels[tent.state] ?? tent.state}
              </span>
              {!tent.complete && (
                <span className="ml-2 mt-1 inline-block rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Incomplète
                </span>
              )}
            </div>
          </div>

          {/* Missing items badges */}
          {missingKeys.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-red-500">Éléments manquants</p>
              <div className="flex flex-wrap gap-2">
                {missingKeys.map((k) => (
                  <span key={k} className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 border border-red-200">
                    ⚠️ {MISSING_LABELS[k] ?? k}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Signaler un problème */}
        {tent.state !== "EN_REPARATION" && (
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            {!showRepairConfirm ? (
              <button
                onClick={() => setShowRepairConfirm(true)}
                className="w-full rounded-xl border-2 border-red-300 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
              >
                🔧 Signaler un problème
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium text-slate-700">Confirmer le signalement ? La tente passera en <strong>En réparation</strong>.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRepairConfirm(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Annuler
                  </button>
                  <button
                    disabled={reportRepairMutation.isLoading}
                    onClick={() => reportRepairMutation.mutate({ id: tent.id, values: { state: "EN_REPARATION" } })}
                    className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-40"
                  >
                    {reportRepairMutation.isLoading ? "Envoi..." : "Confirmer"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {tent.state === "EN_REPARATION" && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-red-700">🔧 Cette tente est actuellement en réparation.</p>
          </div>
        )}

        {/* Details */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Caractéristiques</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Type</dt>
              <dd className="font-semibold text-slate-900">{tent.type.toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Taille</dt>
              <dd className="font-semibold text-slate-900">{tent.size} place{tent.size > 1 ? "s" : ""}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Sardines</dt>
              <dd className="font-semibold text-slate-900">{tent.pegs} sardine{tent.pegs !== 1 ? "s" : ""}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Tapis de sol</dt>
              <dd className="font-semibold text-slate-900">{tent.integrated ? "Intégré" : "Normal"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-slate-600">Complète</dt>
              <dd className={`font-semibold ${tent.complete ? "text-slate-900" : "text-red-600"}`}>{tent.complete ? "Oui" : "Non"}</dd>
            </div>
            {hasRealComment && (
              <div className="flex justify-between">
                <dt className="font-medium text-slate-600">Commentaire</dt>
                <dd className="max-w-[55%] text-right font-semibold text-slate-900">{tent.comments}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Active loan */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Emprunt en cours</h2>
          {activeLoan ? (
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
              <span className="text-2xl">🏕️</span>
              <div>
                <p className="font-semibold text-amber-800">{unitLabels[activeLoan.borrower] ?? activeLoan.borrower}</p>
                <p className="text-xs text-amber-600">Depuis le {new Date(activeLoan.loanedAt).toLocaleDateString("fr-FR")}</p>
                {activeLoan.note && <p className="mt-1 text-xs italic text-amber-700">{activeLoan.note}</p>}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Aucun emprunt en cours — tente disponible.</p>
          )}
        </div>

        {/* Loan form */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Enregistrer un emprunt</h2>
          {!showLoanForm ? (
            <button
              onClick={() => setShowLoanForm(true)}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              + Nouvelle sortie
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Unité emprunteuse</label>
                <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-emerald-500">
                  <option value="">— Choisir une unité —</option>
                  {Object.entries(unitLabels).map(([key, lbl]) => <option key={key} value={key}>{lbl}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Note (optionnel)</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="ex: Camp d'été 2026" className="w-full rounded-lg border border-slate-200 p-2 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowLoanForm(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">Annuler</button>
                <button
                  disabled={!selectedUnit || createLoanMutation.isLoading}
                  onClick={() => createLoanMutation.mutate({ tentId: tent.id, borrower: selectedUnit, note: note || undefined })}
                  className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
                >
                  {createLoanMutation.isLoading ? "Envoi..." : "Confirmer"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Loan history */}
        {loanHistory.length > 0 && (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">Historique des emprunts</h2>
            <ol className="space-y-3">
              {loanHistory.map((loan) => (
                <li key={loan.id} className="flex items-start gap-3 text-sm">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                    {loan.returnedAt ? "✓" : "→"}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{unitLabels[loan.borrower] ?? loan.borrower}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(loan.loanedAt).toLocaleDateString("fr-FR")}
                      {loan.returnedAt && ` → ${new Date(loan.returnedAt).toLocaleDateString("fr-FR")}`}
                    </p>
                    {loan.note && <p className="mt-0.5 text-xs italic text-slate-400">{loan.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* QR Code */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">QR Code</h2>
          <div className="flex flex-col items-center gap-4">
            <QRCodeCanvas value={pageUrl} size={160} />
            <p className="text-center text-xs text-slate-400">Scannez pour accéder à cette page</p>
          </div>
        </div>

        {/* Lien page complète */}
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <Link href="/tentes" className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900">
            → Accéder à la gestion complète des tentes
          </Link>
        </div>
      </div>
    </div>
  )
}
