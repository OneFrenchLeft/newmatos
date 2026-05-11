import AppLayout from "@/components/app/Layout"
import { stateColors, stateLabels } from "@/components/app/dashboard/StateChart"
import { trpc } from "@/utils/trpc"
import { sortTentLabel } from "@/utils/tentSort"
import classNames from "classnames"
import Head from "next/head"
import { useRouter } from "next/router"
import { ReactElement, useEffect, useRef } from "react"
import { toast } from "react-hot-toast"
import { NextPageWithLayout } from "./_app"

type MissingItems = {
  missingZip:        boolean
  missingFaitiere:   boolean
  missingDoubleToit: boolean
  missingToile:      boolean
  missingTapis:      boolean
  missingSardines:   boolean
  missingSacTente:   boolean
}

const ITEM_KEYS = [
  "missingZip",
  "missingFaitiere",
  "missingDoubleToit",
  "missingToile",
  "missingTapis",
  "missingSardines",
  "missingSacTente",
] as const

const ITEM_LABELS: Record<typeof ITEM_KEYS[number], string> = {
  missingZip:        "Zip",
  missingFaitiere:   "Faitière",
  missingDoubleToit: "Double toit",
  missingToile:      "Toile de tente",
  missingTapis:      "Tapis de sol",
  missingSardines:   "Sardines",
  missingSacTente:   "Sac de tentes",
}

const getItems = (tent: Record<string, unknown>): MissingItems => ({
  missingZip:        typeof tent.missingZip === "boolean"        ? tent.missingZip        : false,
  missingFaitiere:   typeof tent.missingFaitiere === "boolean"   ? tent.missingFaitiere   : false,
  missingDoubleToit: typeof tent.missingDoubleToit === "boolean" ? tent.missingDoubleToit : false,
  missingToile:      typeof tent.missingToile === "boolean"      ? tent.missingToile      : false,
  missingTapis:      typeof tent.missingTapis === "boolean"      ? tent.missingTapis      : false,
  missingSardines:   typeof tent.missingSardines === "boolean"   ? tent.missingSardines   : false,
  missingSacTente:   typeof tent.missingSacTente === "boolean"   ? tent.missingSacTente   : false,
})

const CeQuiManquePage: NextPageWithLayout = () => {
  const router = useRouter()
  const { data: tents, isLoading, refetch } = trpc.tents.getAll.useQuery()

  const updateChecklistMutation = trpc.tents.updateChecklist.useMutation({
    onSettled: () => refetch(),
    onError: () => toast.error("Erreur lors de la sauvegarde"),
  })

  const highlightId = (router.query.t as string) || null
  const highlightRef = useRef<HTMLTableRowElement | null>(null)

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [tents])

  const toggle = (tent: NonNullable<typeof tents>[number], field: typeof ITEM_KEYS[number]) => {
    const current = getItems(tent as unknown as Record<string, unknown>)
    const updated: MissingItems = { ...current, [field]: !current[field] }
    updateChecklistMutation.mutate({ id: tent.id, checklist: updated })
  }

  const sortedTents = (tents ?? []).slice().sort((a, b) =>
    sortTentLabel(a.identifyingLabel, b.identifyingLabel, "asc")
  )

  const missingCount = sortedTents.filter((tent) => {
    const items = getItems(tent as unknown as Record<string, unknown>)
    return Object.values(items).some(Boolean)
  }).length

  return (
    <>
      <Head><title>Ce qui manque | MonMatos</title></Head>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="whitespace-nowrap text-4xl font-bold lg:text-5xl">
            <span>Ce qui </span><span className="text-emerald-600">manque</span>
          </h1>
          {missingCount > 0 && (
            <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
              {missingCount} tente{missingCount > 1 ? "s" : ""} incomplète{missingCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <p className="text-slate-500">Cochez les éléments manquants pour chaque tente. Le tag « Complète » est mis à jour automatiquement.</p>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )}

        {!isLoading && sortedTents.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <p className="text-lg font-medium">Aucune tente enregistrée</p>
          </div>
        )}

        {!isLoading && sortedTents.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Tente</th>
                  <th className="px-4 py-3 text-center">État</th>
                  {ITEM_KEYS.map((key) => (
                    <th key={key} className="px-3 py-3 text-center">{ITEM_LABELS[key]}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTents.map((tent) => {
                  const items = getItems(tent as unknown as Record<string, unknown>)
                  const hasIssue = Object.values(items).some(Boolean)
                  const isHighlighted = tent.id === highlightId
                  return (
                    <tr
                      key={tent.id}
                      ref={isHighlighted ? highlightRef : null}
                      className={classNames(
                        "transition-colors hover:bg-slate-50",
                        hasIssue ? "bg-red-50/50" : "",
                        isHighlighted ? "ring-2 ring-inset ring-emerald-400" : ""
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={classNames(
                            "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                            hasIssue ? "border-red-500 text-red-500" : "border-slate-700"
                          )}>
                            {tent.identifyingLabel.length > 3 ? tent.identifyingLabel.slice(0, 3) : tent.identifyingLabel}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Tente {tent.identifyingLabel}</p>
                            <p className="text-xs text-slate-400">{tent.type} · {tent.size} place{tent.size > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={classNames(
                          "inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white",
                          stateColors[tent.state]
                        )}>
                          {stateLabels[tent.state]}
                        </span>
                      </td>
                      {ITEM_KEYS.map((field) => (
                        <td key={field} className="px-3 py-3 text-center">
                          <label className="inline-flex cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              checked={items[field]}
                              onChange={() => toggle(tent, field)}
                              className="h-5 w-5 cursor-pointer accent-red-500"
                              disabled={updateChecklistMutation.isLoading}
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}

CeQuiManquePage.getLayout = (page: ReactElement) => (
  <AppLayout title="Ce qui manque">{page}</AppLayout>
)

export default CeQuiManquePage
