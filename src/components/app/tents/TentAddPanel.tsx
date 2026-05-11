import { Modal } from "@/components/app/modal"
import { useModalContext } from "@/components/hooks/useModalContext"
import Button from "@/components/ui/Button"
import Icon from "@/components/ui/Icon"
import Textarea from "@/components/ui/Textarea"
import { Tents } from "@/pages/tentes"
import { trpc } from "@/utils/trpc"
import { UIProps } from "@/utils/typedProps"
import { State } from "@prisma/client"
import classNames from "classnames"
import Head from "next/head"
import { FC, FormEvent, useState } from "react"
import { toast } from "react-hot-toast"
import TentInput from "./TentInput"
import { getTentsErrorMessage } from "./tentsErrorMessage"

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

const TentAddPanel: FC<UIProps<{ tents: Tents }>> = ({ tents }) => {
  const { setModal } = useModalContext()
  const trpcCtx = trpc.useContext()

  const createMutation = trpc.tents.create.useMutation({
    onSuccess() {
      setModal({} as Modal)
    },
    onError(error) {
      toast.error(error.message || "Une erreur inattendue s'est produite.")
    },
    onSettled() {
      trpcCtx.tents.getAll.invalidate()
    },
  })

  const existingLabels = (tents ?? []).map((t) =>
    t.identifyingLabel.trim().toLowerCase(),
  )

  const [label, setLabel] = useState("")
  const [state, setState] = useState<State>("Neuf")
  const [size, setSize] = useState("6")
  const [complete, setComplete] = useState(true)
  const [integrated, setIntegrated] = useState(false)
  const [type, setType] = useState("Canadienne")
  const [pegs, setPegs] = useState<number | "">("")
  const [comments, setComments] = useState("")

  const closePanel = () => setModal({} as Modal)

  const trimmed = label.trim()
  const alreadyUsed = existingLabels.includes(trimmed.toLowerCase())
  const labelValid = trimmed.length > 0 && !alreadyUsed

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!labelValid) return
    const createPromise = createMutation.mutateAsync({
      identifyingLabel: trimmed,
      state,
      size: parseInt(size),
      complete,
      integrated,
      type,
      pegs: pegs === "" ? 0 : pegs,
      comments,
    })
    try {
      await toast.promise(createPromise, {
        success: "Tente ajoutée",
        error: getTentsErrorMessage,
        loading: "Ajout en cours ...",
      })
    } catch { /* handled */ }
  }

  return (
    <>
      <Head><title>Ajouter une tente | MonMatos</title></Head>
      <form className="mx-auto max-w-[450px] space-y-6 py-4" onSubmit={handleAdd}>
        <div
          className={classNames(
            "mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4",
            {
              "border-slate-800 text-slate-800": !trimmed,
              "border-emerald-500/90 text-emerald-500/90": trimmed && labelValid,
              "border-red-500/90 text-red-500/90": trimmed && !labelValid,
            },
          )}
        >
          <input
            type="text"
            autoFocus
            className="w-[90px] rounded-lg border-2 border-dashed bg-transparent p-1 px-2 text-center text-lg font-bold outline-none"
            placeholder="Ex: 1 ou Bretagne"
            onChange={(e) => setLabel(e.target.value)}
            value={label}
            maxLength={20}
          />
        </div>
        <div className="pt-4">
          <div
            className={classNames(
              "mx-auto flex w-fit items-center space-x-2 rounded-lg py-1 px-2 text-sm font-medium sm:text-base",
              {
                "bg-amber-100 text-amber-800": !trimmed,
                "bg-green-100 text-green-800": trimmed && labelValid,
                "bg-red-100 text-red-800": trimmed && !labelValid,
              },
            )}
          >
            <Icon name="MdOutlineErrorOutline" className="text-xl" />
            <span>
              {alreadyUsed
                ? "Cet identifiant est déjà utilisé"
                : "Choisissez un identifiant unique (chiffre ou nom)"}
            </span>
          </div>
        </div>
        <div>
          <p className="text-lg font-bold">Informations</p>
          <p>Cliquez sur les éléments afin de les modifier</p>
        </div>
        <div className="space-y-2">
          <TentInput label="Taille" value={size} setValue={(v) => setSize(v as string)} options={SIZE_OPTIONS} />
          <TentInput label="État" value={state} setValue={(v) => setState(v as State)} options={Object.entries(stateLabels).map(([k, v]) => [k, v] as [string, string])} />
          <TentInput label="Est elle complète ?" value={complete ? "Oui" : "Non"} setValue={(v) => setComplete(v === "Oui")} options={[["Oui","Oui"],["Non","Non"]]} />
          <TentInput label="Type" value={type} setValue={(v) => setType(v as string)} options={TYPE_OPTIONS} />
          <TentInput label="Tapis de sol" value={integrated ? "Intégré" : "Non intégré"} setValue={(v) => setIntegrated(v === "Intégré")} options={[["Intégré","Intégré"],["Non intégré","Non intégré"]]} />
          <div className="flex items-center rounded-md text-center text-sm font-semibold bg-gray-200">
            <span className="w-[50%] truncate rounded-md rounded-r-none bg-slate-900 px-1 py-2 text-slate-50">Sardines</span>
            <div className="w-full cursor-pointer pr-1">
              <input
                type="number" min={0} max={100} placeholder="Nombre"
                value={pegs === "" ? "" : pegs}
                onChange={(e) => setPegs(e.target.value === "" ? "" : parseInt(e.target.value))}
                className="w-full border-none bg-transparent py-1 px-4 font-semibold outline-none text-center"
              />
            </div>
          </div>
        </div>
        <Textarea label="Commentaires" value={comments} onChange={(e) => setComments(e.target.value)} />
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Button type="button" onClick={closePanel} size="sm" icon="HiArrowLeft" variant="white" className="max-w-fit">Annuler</Button>
          <Button type="submit" disabled={!trimmed || !labelValid || createMutation.isLoading} size="sm" icon="RiSave2Fill" className="max-w-fit">
            {createMutation.isLoading ? "Ajout ..." : "Ajouter"}
          </Button>
        </div>
      </form>
    </>
  )
}

export default TentAddPanel
