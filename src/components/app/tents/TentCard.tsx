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
    identifyingLabel.length <= 2
      ? "text-2xl"
      : identifyingLabel.length <= 4
      ? "text-lg"
      : identifyingLabel.length <= 6
      ? "text-sm"
      : "text-[10px]"

  const circleBorder = complete
    ? "border-slate-800"
    : "border-red-500"

  return (
    <Card className="cursor-pointer" onClick={openViewPanel}>
      <div className="flex flex-col gap-4">
        <div className="flex w-full items-center gap-4">
          <div
            className={classNames(
              "flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full border-4",
              circleBorder,
            )}
          >
            <h2 className={classNames("font-bold", labelFontSize, !complete && "text-red-500")}>
              {identifyingLabel.slice(0, 8)}
            </h2>
          </div>
          <div className="text-left space-y-1">
            <p className="text-sm font-semibold">{String(size)} place{size > 1 ? "s" : ""}</p>
            {size < 6 && (
              <p className="text-xs text-slate-500">
                {integrated ? "Integrée" : "Non intégrée"}
              </p>
            )}
            {!complete && (
              <p className="text-xs font-semibold text-red-500">Incomplète</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <TentCharacteristic type="state" label="état" value={state} variants={stateColors} />
          <TentCharacteristic type="type" label="type" value={type} />
        </div>

        <div className="flex items-center justify-between">
          <div className="cursor-pointer text-xs underline" onClick={openViewPanel}>
            Voir plus d'infos
          </div>
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
