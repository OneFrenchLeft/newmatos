import Card from "@/components/ui/Card"
import Icon from "@/components/ui/Icon"
import Panel from "@/components/ui/Panel"
import { UIProps } from "@/utils/typedProps"
import { State, Tent } from "@prisma/client"
import { FC } from "react"

const OverviewPanel: FC<UIProps<{ tents: Tent[] }>> = ({ tents }) => {
  const countOf = (state: State) => tents.filter((t) => t.state === state).length

  return (
    <Panel id="overview">
      <h2 className="flex items-center space-x-2 p-1 text-2xl font-bold">
        <Icon name="PresentationChartBarIcon" className="w-8" />
        <span>Vue d'ensemble</span>
      </h2>
      <div className="space-y-5 py-4">
        <Card className="max-w-full">
          <div className="flex max-h-full flex-wrap justify-around gap-8 pt-1 text-center">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Nombre total de{" "}
                <span className="text-emerald-500">tentes</span>
              </h3>
              <div className="text-5xl font-bold text-emerald-500">{tents.length}</div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Tentes{" "}
                <span className="text-orange-500">mauvais état</span>
              </h3>
              <div className="text-5xl font-bold text-orange-500">
                {countOf("MAUVAIS")}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Tentes{" "}
                <span className="text-yellow-500">en réparation</span>
              </h3>
              <div className="text-5xl font-bold text-yellow-500">
                {countOf("EN_REPARATION")}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                Tentes{" "}
                <span className="text-red-500">inutilisables</span>
              </h3>
              <div className="text-5xl font-bold text-red-500">
                {countOf("INUTILISABLE")}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Panel>
  )
}

export default OverviewPanel
