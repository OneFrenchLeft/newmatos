import { stateColors } from "@/components/app/dashboard/StateChart"
import { useModalContext } from "@/components/hooks/useModalContext"
import Card from "@/components/ui/Card"
import Icon from "@/components/ui/Icon"
import Tooltip from "@/components/ui/Tooltip"
import type { Tent } from "@/pages/tentes"
import { UIProps } from "@/utils/typedProps"
import classNames from "classnames"
import { FC } from "react"
import TentCharacteristic from "./TentCharacteristic"
import TentDeletePanel from "./TentDeletePanel"
import TentUpdatePanel from "./TentUpdatePanel"
import TentViewPanel from "./TentViewPanel"

const MISSING_LABELS: Record<string, string> = {
  missingZip:        "Zip",
  missingFaitiere:   "Faitière",
  missingDoubleToit: "Double toit",
  missingToile:      "Toile",
  missingTapis:      "Tapis",
  missingSardines:   "Sardines",
  missingSacTente:   "Sac",
}

const MISSING_KEYS = Object.keys(MISSING_LABELS)

function parseInspectionHistory(raw: string | null | undefined): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as string[]
  } catch { /* ignore */ }
  return []
}

const TentCard: FC<UIProps<{ tent: Tent }>> = ({ tent }) => {
  const { identifyingLabel, size, state, type, complete, integrated } = tent
  const { setModal } = useModalContext()

  const openViewPanel = () =>
    setModal({ component: <TentViewPanel tent={tent} />, visible: true })

  const openDeletePanel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setModal({ component: <TentDeletePanel tent={tent} />, visible: true })
  }

  const openUpdatePanel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setModal({ component: <TentUpdatePanel tent={tent} />, visible: true })
  }

  const labelFontSize =
    identifyingLabel.length <= 2 ? "text-2xl"
    : identifyingLabel.length <= 4 ? "text-lg"
    : identifyingLabel.length <= 6 ? "text-sm"
    : "text-[10px]"

  const isProblematic = !complete || state === "EN_REPARATION"
  const circleBorder = isProblematic ? "border-red-500" : "border-slate-800"

  // Booléens checklist directement depuis le type Tent (inféré de getAll)
  const missingKeys = MISSING_KEYS.filter(
    (k) => (tent as unknown as Record<string, unknown>)[k] === true
  )

  const inspections = parseInspectionHistory(
    (tent as unknown as Record<string, unknown>).inspectionHistory as string | null
  )
  const lastInspection = inspections.length > 0
    ? new Date(inspections[inspections.length - 1] as string).toLocaleDateString("fr-FR")
    : null

  return (
    <Card className={classNames("cursor-pointer", isProblematic && "ring-1 ring-red-300")} onClick={openViewPanel}>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center gap-4">
          <div className={classNames("flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4", circleBorder)}>
            <h2 className={classNames("font-bold", labelFontSize, isProblematic && "text-red-500")}>
              {identifyingLabel.slice(0, 8)}
            </h2>
          </div>
          <div className="text-left space-y-1">
            <p className="text-sm font-semibold">{String(size)} place{size > 1 ? "s" : ""}</p>
            {size < 6 && <p className="text-xs text-slate-500">{integrated ? "Intégrée" : "Non intégrée"}</p>}
            {!complete && <p className="text-xs font-semibold text-red-500">Incomplète</p>}
            {state === "EN_REPARATION" && <p className="text-xs font-semibold text-red-500">En réparation</p>}
            {lastInspection ? (
              <p className="text-xs text-emerald-600 font-medium">🗓️ {lastInspection}</p>
            ) : (
              <p className="text-xs text-slate-400">Jamais contrôlée</p>
            )}
          </div>
        </div>

        {missingKeys.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {missingKeys.map((k) => (
              <span key={k} className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                {MISSING_LABELS[k]}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <TentCharacteristic type="state" label="état" value={state} variants={stateColors} />
          <TentCharacteristic type="type" label="type" value={type} />
        </div>

        <div className="flex items-center justify-between">
          <div className="cursor-pointer text-xs underline" onClick={openViewPanel}>Voir plus d'infos</div>
          <div className="flex items-center">
            <button type="button" onClick={openUpdatePanel} className="group relative hover:text-blue-500">
              <Icon name="HiPencil" />
              <Tooltip className="-left-8">Modifier</Tooltip>
            </button>
            <button type="button" onClick={openDeletePanel} className="group relative hover:text-red-500">
              <Icon name="HiTrash" />
              <Tooltip className="-left-8">Supprimer</Tooltip>
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default TentCard
