import Card from "@/components/ui/Card"
import Icon from "@/components/ui/Icon"
import { UIProps } from "@/utils/typedProps"
import { State, Tent } from "@prisma/client"
import classNames from "classnames"
import { FC } from "react"

export const stateColors: Record<State, string> = {
  INUTILISABLE: "bg-red-500/90",
  MAUVAIS: "bg-orange-400/90",
  EN_REPARATION: "bg-yellow-400/90",
  BON: "bg-lime-500/90",
  NEUF: "bg-green-500/90",
}

export const stateLabels: Record<State, string> = {
  INUTILISABLE: "Inutilisable",
  MAUVAIS: "Mauvais",
  EN_REPARATION: "En réparation",
  BON: "Bon",
  NEUF: "Neuf",
}

const Bar: FC<UIProps<{ state: State; count: number; total: number }>> = ({
  state,
  count,
  total,
}) => {
  return (
    <div className="flex basis-1/5 flex-col-reverse items-center font-bold text-slate-900 sm:w-16">
      <div className="flex h-8 w-full items-center justify-center">
        <span className="text-lg">{count}</span>
      </div>
      <div
        style={{ height: `${(count / total) * 230 || 4}px` }}
        className={classNames("expends w-full rounded-sm", stateColors[state])}
      />
    </div>
  )
}

const StateChart: FC<UIProps<{ tents: Tent[]; className?: string }>> = ({
  tents,
}) => {
  const countOf = (state: State) => {
    return tents.filter((t) => t.state === state).length
  }
  const average =
    Object.values(State)
      .map((value, index) => countOf(value) * index)
      .reduce((acc, curr) => acc + curr) / tents.length || 0
  const note = (average * 20) / 4

  return (
    <Card className="max-w-full">
      <h3 className="flex items-center space-x-2 self-start text-xl font-semibold text-red-500">
        <Icon name="FaHeartbeat" />
        <span className="text-slate-900">
          État des <span className="text-emerald-600">tentes</span>
        </span>
      </h3>
      <div className="flex w-full flex-col items-center justify-around gap-8 rounded-xl md:flex-row md:items-end">
        <div className="flex w-full flex-col items-end gap-4 sm:w-fit lg:h-[300px] lg:flex-row lg:gap-0">
          <div className="mr-4 space-y-1 self-start py-3">
            {(Object.entries(State) as [State, State][])
              .map(([, value]) => (
                <div key={value} className="flex items-center space-x-2">
                  <div className={classNames("h-5 w-5 rounded-sm", stateColors[value])} />
                  <span className="text-xs">{stateLabels[value]}</span>
                </div>
              ))
              .reverse()}
          </div>
          <div className="mx-auto flex w-full items-end space-x-3">
            {(Object.entries(State) as [State, State][])
              .map(([, value]) => (
                <Bar state={value} count={countOf(value)} total={tents.length} key={value} />
              ))
              .reverse()}
          </div>
        </div>
        <div
          className={classNames(
            "flex w-full flex-col items-center gap-3 self-center rounded-md border-4 border-dashed p-4 md:w-fit",
            {
              "border-red-800": note < 4,
              "border-red-500": note >= 4,
              "border-orange-500": note >= 8,
              "border-yellow-500": note >= 10,
              "border-lime-500": note >= 14,
              "border-emerald-500": note >= 18,
            },
          )}
        >
          <h3 className="flex items-center space-x-2 text-xl font-semibold">
            <Icon name="FaGraduationCap" />
            <span>Moyenne</span>
          </h3>
          <p className="text-5xl font-bold">{note.toFixed(1)}</p>
          <p className="text-sm text-slate-500">/20</p>
        </div>
      </div>
    </Card>
  )
}

export default StateChart
