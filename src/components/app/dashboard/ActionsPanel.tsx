import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Icon from "@/components/ui/Icon"
import Panel from "@/components/ui/Panel"
import { downloadExcel } from "@/utils/downloadFns"
import { UIProps } from "@/utils/typedProps"
import { Tent } from "@prisma/client"
import { FC } from "react"
import { useGroup } from "../../hooks/useGroup"

const ActionsPanel: FC<UIProps<{ tents: Tent[] }>> = ({ tents }) => {
  const { movement } = useGroup()

  return (
    <Panel id="actions">
      <h2 className="flex items-center space-x-2 p-1 text-2xl font-bold">
        <Icon name="CursorClickIcon" className="w-8" />
        <span>Actions</span>
      </h2>
      <div className="py-4">
        <div className="mx-auto w-full max-w-[350px] space-y-6">
          <h3 className="ml-2 flex items-center space-x-2 self-start text-xl font-semibold">
            <Icon name="FaCampground" />
            <span>Tentes</span>
          </h3>
          <div className="flex flex-col items-center justify-center gap-3">
            <ButtonLink
              href="/tentes?t=add"
              variant="black"
              size="sm"
              icon="BsPlusLg"
            >
              Ajouter une tente
            </ButtonLink>
            <ButtonLink
              href="/tentes"
              variant="white"
              icon="TiThList"
              size="sm"
            >
              Parcourir les tentes
            </ButtonLink>
            <ButtonLink
              href="/ce-qui-manque"
              variant="white"
              icon="TiThList"
              size="sm"
            >
              Ce qui manque
            </ButtonLink>
            <Button
              type="button"
              icon="RiFileExcel2Fill"
              size="sm"
              onClick={downloadExcel(tents, movement)}
            >
              Exporter en .xlsx
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export default ActionsPanel
