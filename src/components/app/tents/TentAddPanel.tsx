// Importation des composants, hooks et utilitaires nécessaires
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

// Définition du composant principal TentAddPanel
const TentAddPanel: FC<UIProps<{ tents: Tents }>> = ({ tents }) => {
  const { setModal } = useModalContext()
  const trpcCtx = trpc.useContext()

  // Mutation pour créer une tente via TRPC
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

  const existingNums = (tents ?? []).map((tent) => tent.identifyingNum)
  const [identifyingNum, setIdentifyingNum] = useState<string>("")
  const [state, setState] = useState<State>("NEUF")
  const [size, setSize] = useState(6)
  const [complete, setComplete] = useState(true)
  const [integrated, setIntegrated] = useState(false)
  const [type, setType] = useState("CANADIENNE")
  const [pegs, setPegs] = useState(0)
  const [comments, setComments] = useState("")

  const closePanel = () => setModal({} as Modal)

  const parsedNum = parseInt(identifyingNum)
  const numAlreadyUsed = existingNums.includes(parsedNum)
  const numValid = !isNaN(parsedNum) && parsedNum > 0 && !numAlreadyUsed

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()

    if (!numValid) return

    const createPromise = createMutation.mutateAsync({
      identifyingNum: parsedNum,
      state,
      size,
      complete,
      integrated,
      type,
      pegs,
      comments,
    })
    try {
      await toast.promise(createPromise, {
        success: "Tente ajoutée",
        error: getTentsErrorMessage,
        loading: "Ajout en cours ...",
      })
    } catch (error) {
      // handled by mutation
    }
  }

  return (
    <>
      <Head>
        <title>Ajouter une tente | MonMatos</title>
      </Head>

      <form
        className="mx-auto max-w-[450px] space-y-6 py-4"
        onSubmit={handleAdd}
      >
        {/* Identifiant numérique de la tente */}
        <div
          className={classNames(
            "mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4",
            {
              "border-slate-800 text-slate-800": !identifyingNum,
              "border-emerald-500/90 text-emerald-500/90":
                identifyingNum && numValid,
              "border-red-500/90 text-red-500/90":
                identifyingNum && !numValid,
            },
          )}
        >
          <input
            type="number"
            autoFocus
            min={1}
            className="w-[90px] rounded-lg border-2 border-dashed bg-transparent p-1 px-2 text-center text-3xl font-bold outline-none"
            placeholder={"0"}
            onChange={(e) => setIdentifyingNum(e.target.value)}
            value={identifyingNum}
          />
        </div>

        <div className="pt-4">
          <div
            className={classNames(
              "mx-auto flex w-fit items-center space-x-2 rounded-lg py-1 px-2 text-sm font-medium sm:text-base",
              {
                "bg-amber-100 text-amber-800": !identifyingNum,
                "bg-green-100 text-green-800": identifyingNum && numValid,
                "bg-red-100 text-red-800": identifyingNum && !numValid,
              },
            )}
          >
            <Icon name="MdOutlineErrorOutline" className="text-xl" />
            <span>Choisissez un numéro de tente non attribué</span>
          </div>
        </div>

        <div>
          <p className="text-lg font-bold">Informations</p>
          <p>Cliquez sur les éléments afin de les modifier</p>
        </div>

        <div className="space-y-2">
          {/* Taille */}
          <TentInput
            label="Taille"
            value={size.toString()}
            setValue={(value) => setSize(parseInt(value as string))}
            options={[
              ["0", "N'accueille pas de personne"],
              ["1", "1 place"],
              ["2", "2 places"],
              ["3", "3 places"],
              ["4", "4 places"],
              ["5", "5 places"],
              ["6", "6 places"],
              ["8", "8 places"],
            ]}
          />

          {/* État */}
          <TentInput
            label="ÉTAT"
            value={state}
            setValue={(value) => setState(value as State)}
            options={Object.entries(State).map(([key, value]) => [
              key as State,
              value,
            ])}
          />

          {/* Complète */}
          <TentInput
            label="Complète ?"
            value={complete ? "OUI" : "NON"}
            setValue={(value) => setComplete(value === "OUI")}
            options={[
              ["OUI", "OUI"],
              ["NON", "NON"],
            ]}
          />

          {/* Type */}
          <TentInput
            label="TYPE"
            value={type}
            setValue={(value) => setType(value)}
            options={[
              ["CANADIENNE", "CANADIENNE"],
              ["QUECHUA", "QUECHUA"],
              ["MARABOUT", "MARABOUT"],
            ]}
          />

          {/* Tapis de sol */}
          <TentInput
            label="Tapis de sol"
            value={integrated ? "INTÉGRÉ" : "NORMAL"}
            setValue={(value) => setIntegrated(value === "INTÉGRÉ")}
            options={[
              ["INTÉGRÉ", "INTÉGRÉ"],
              ["NORMAL", "NORMAL"],
            ]}
          />

          {/* Nombre de piquets */}
          <TentInput
            label="Piquets"
            value={pegs.toString()}
            setValue={(value) => setPegs(parseInt(value as string))}
            options={Array.from({ length: 21 }, (_, i) => [
              i.toString(),
              i === 0 ? "0 piquet" : `${i} piquet${i > 1 ? "s" : ""}`,
            ] as [string, string])}
          />
        </div>

        <Textarea
          label="Commentaires"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />

        <div className="flex flex-wrap items-center justify-center gap-8">
          <Button
            type="button"
            onClick={closePanel}
            size="sm"
            icon="HiArrowLeft"
            variant="white"
            className="max-w-fit"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={
              !identifyingNum ||
              !numValid ||
              createMutation.isLoading
            }
            size="sm"
            icon="RiSave2Fill"
            className="max-w-fit"
          >
            {createMutation.isLoading ? "Ajout ..." : "Ajouter"}
          </Button>
        </div>
      </form>
    </>
  )
}

export default TentAddPanel
