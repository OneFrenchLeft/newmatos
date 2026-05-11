import AppLayout from "@/components/app/Layout"
import { trpc } from "@/utils/trpc"
import { sortTentLabel } from "@/utils/tentSort"
import Head from "next/head"
import { ReactElement, useEffect, useState } from "react"
import { NextPageWithLayout } from "./_app"

type MissingItems = {
  zip: boolean
  faitiere: boolean
  doubleToit: boolean
}

type MissingState = Record<string, MissingItems>

const defaultItems = (): MissingItems => ({ zip: false, faitiere: false, doubleToit: false })
const STORAGE_KEY = "ce-qui-manque"

const CeQuiManquePage: NextPageWithLayout = () => {
  const { data: tents, isLoading } = trpc.tents.getAll.useQuery()
  const [missing, setMissing] = useState<MissingState>({})

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) setMissing(JSON.parse(saved) as MissingState)
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(missing)) }
    catch { /* ignore */ }
  }, [missing])

  const toggle = (tentId: string, field: keyof MissingItems) => {
    setMissing((prev) => ({
      ...prev,
      [tentId]: { ...(prev[tentId] ?? defaultItems()), [field]: !(prev[tentId]?.[field] ?? false) },
    }))
  }

  const getItems = (tentId: string): MissingItems => missing[tentId] ?? defaultItems()

  const sortedTents = (tents ?? []).slice().sort((a, b) =>
    sortTentLabel(a.identifyingLabel, b.identifyingLabel, "asc")
  )

  const missingCount = sortedTents.filter((tent) => {
    const items = getItems(tent.id)
    return items.zip || items.faitiere || items.doubleToit
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
        <p className="text-slate-500">Cochez les éléments manquants pour chaque tente.</p>

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
            <p className="text-sm">Ajoutez des tentes depuis la page "Mes Tentes".</p>
          </div>
        )}

        {!isLoading && sortedTents.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Tente</th>
                  <th className="px-4 py-3 text-center">Zip</th>
                  <th className="px-4 py-3 text-center">Faitière</th>
                  <th className="px-4 py-3 text-center">Double toit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedTents.map((tent) => {
                  const items = getItems(tent.id)
                  const hasIssue = items.zip || items.faitiere || items.doubleToit
                  return (
                    <tr key={tent.id} className={`transition-colors hover:bg-slate-50 ${hasIssue ? "bg-red-50/50" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-slate-700 text-xs font-bold">
                            {tent.identifyingLabel.length > 3 ? tent.identifyingLabel.slice(0, 3) : tent.identifyingLabel}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Tente {tent.identifyingLabel}</p>
                            <p className="text-xs text-slate-400">{tent.type} · {tent.size} place{tent.size > 1 ? "s" : ""}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input type="checkbox" checked={items.zip} onChange={() => toggle(tent.id, "zip")} className="h-5 w-5 cursor-pointer accent-red-500" aria-label={`Zip manquant pour tente ${tent.identifyingLabel}`} />
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input type="checkbox" checked={items.faitiere} onChange={() => toggle(tent.id, "faitiere")} className="h-5 w-5 cursor-pointer accent-red-500" aria-label={`Faitière manquante pour tente ${tent.identifyingLabel}`} />
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input type="checkbox" checked={items.doubleToit} onChange={() => toggle(tent.id, "doubleToit")} className="h-5 w-5 cursor-pointer accent-red-500" aria-label={`Double toit manquant pour tente ${tent.identifyingLabel}`} />
                        </label>
                      </td>
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
