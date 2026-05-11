import type { Modal } from "@/components/app/modal"
import { useModalContext } from "@/components/hooks/useModalContext"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Textarea from "@/components/ui/Textarea"
import type { Tent } from "@/pages/tentes"
import { trpc } from "@/utils/trpc"
import { UIProps } from "@/utils/typedProps"
import { State } from "@prisma/client"
import classNames from "classnames"
import Head from "next/head"
import { FC, FormEvent, useState } from "react"
import { toast } from "react-hot-toast"
import TentInput from "./TentInput"
import { getTentsErrorMessage } from "./tentsErrorMessage"
import TentViewPanel from "./TentViewPanel"

const stateLabels: Record<State, string> = {
  INUTILISABLE: "Inutilisable",
  MAUVAIS: "Mauvais",
  EN_REPARATION: "En réparation",
  BON: "Bon",
  NEUF: "Neuf",
}

const TYPE_OPTIONS: [string, string][] = [
  ["Canadienne", "Canadienne"],
  ["Marabout", "Marabout"],
  ["Quechua", "Quechua"],
  ["Tente inversée", "Tente inversée"],
  ["Tipi", "Tipi"],
]

const SIZE_OPTIONS: [string, string][] = [
  ["0", "N'accueille pas de personne"],
  ["1", "1 place"],
  ["2", "2 places"],
  ["3", "3 places"],
  ["4", "4 places"],
  ["5", "5 places"],
  ["6", "6 places"],
  ["8", "8 places"],
  ["10", "10 places"],
]

const TentUpdatePanel: FC<UIProps<{ tent: Tent }>> = ({ tent }) => {
  const { setModal } = useModalContext()
  const trpcCtx = trpc.useContext()
  const updateMutation = trpc.tents.update.useMutation({
    onSuccess() {
      setModal({} as Modal)
    },
    onSettled() {
      trpcCtx.tents.getAll.invalidate()
    },
  })

  const [label, setLabel] = useState(tent.identifyingLabel)
  const [state, setState] = useState(tent.state)
  const [size, setSize] = useState(tent.size.toString())
  const [complete, setComplete] = useState(tent.complete)
  const [integrated, setIntegrated] = useState(tent.integrated)
  const [type, setType] = useState(tent.type)
  const [pegs, setPegs] = useState<number | "">(tent.pegs ?? "")
  const [comments, setComments] = useState(tent.comments || "")

  const goBackToViewPanel = () =>
    setModal({ component: <TentViewPanel tent={tent} />, visible: true })

  const handleUpdate = (e: FormEvent) => {
    e.preventDefault()
    const p = updateMutation.mutateAsync({
      id: tent.id,
      values: {
        identifyingLabel: label.trim(),
        state,
        size: parseInt(size),
        complete,
        integrated,
        type,
        pegs: pegs === "" ? 0 : pegs,
        comments,
      },
    })
    toast.promise(p, {
      success: "Modifications sauvegardées",
      error: getTentsErrorMessage,
      loading: "Sauvegarde en cours ...",
    })
  }

  return (
    <>
      <Head>
        <title>{`Modifier la tente ${tent.identifyingLabel} | MonMatos`}</title>
      </Head>
      <form className="mx-auto max-w-[450px] space-y-6 py-4" onSubmit={handleUpdate}>
        <div
          className={classNames(
            "mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4",
            complete ? "border-slate-800" : "border-red-500"
          )}
        >
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={20}
            className={classNames(
              "w-[90px] rounded-lg border-2 border-dashed bg-transparent p-1 px-2 text-center text-lg font-bold outline-none",
              !complete && "text-red-500"
            )}
          />
        </div>
        <div className="pt-4">
          <div className="mx-auto flex w-fit items-center space-x-2 rounded-lg bg-green-100 py-1 px-2 text-sm font-medium text-green-800 sm:text-base">
            <Icon name="MdOutlineErrorOutline" className="text-xl" />
            <span>Pensez à sauvegarder vos modifications</span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold">Informations</p>
          <p>Cliquez sur les éléments afin de les modifier</p>
        </div>
        <div className="space-y-2">
          <TentInput label="Taille" value={size} setValue={(v) => setSize(v as string)} options={SIZE_OPTIONS} />
          <TentInput label="État" value={state} setValue={(v) => setState(v as State)} options={Object.entries(stateLabels).map(([k, v]) => [k, v] as [string, string])} />
          <TentInput label="Complète ?" value={complete ? "Oui" : "Non"} setValue={(v) => setComplete(v === "Oui")} options={[["Oui","Oui"],["Non","Non"]]} />
          <TentInput label="Type" value={type} setValue={(v) => setType(v as string)} options={TYPE_OPTIONS} />
          <TentInput label="Tapis de sol" value={integrated ? "Intégré" : "Non intégré"} setValue={(v) => setIntegrated(v === "Intégré")} options={[["Intégré","Intégré"],["Non intégré","Non intégré"]]} />
          <div className="flex items-center rounded-md text-center text-sm font-semibold bg-gray-200">
            <span className="w-[50%] truncate rounded-md rounded-r-none bg-slate-900 px-1 py-2 text-slate-50">
              Sardines
            </span>
            <div className="w-full cursor-pointer pr-1">
              <input
                type="number"
                min={0}
                max={100}
                placeholder="Nombre"
                value={pegs === "" ? "" : pegs}
                onChange={(e) => setPegs(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full border-none bg-transparent py-1 px-4 font-semibold outline-none text-center"
              />
            </div>
          </div>
        </div>
        <Textarea label="Commentaires" value={comments} onChange={(e) => setComments(e.target.value)} />
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Button type="button" onClick={goBackToViewPanel} size="sm" icon="HiArrowLeft" variant="white" className="max-w-fit">Retour</Button>
          <Button type="submit" disabled={updateMutation.isLoading} size="sm" icon="RiSave2Fill" className="max-w-fit">
            {updateMutation.isLoading ? "Sauvegarde ..." : "Sauvegarder"}
          </Button>
        </div>
      </form>
    </>
  )
}

export default TentUpdatePanel
