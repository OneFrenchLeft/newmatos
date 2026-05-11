import type { Modal } from "@/components/app/modal"
import { useModalContext } from "@/components/hooks/useModalContext"
import Button from "@/components/ui/Button"
import type { Tent } from "@/pages/tentes"
import { trpc } from "@/utils/trpc"
import { UIProps } from "@/utils/typedProps"
import Head from "next/head"
import { FC } from "react"
import { toast } from "react-hot-toast"
import { getTentsErrorMessage } from "./tentsErrorMessage"

const TentDeletePanel: FC<UIProps<{ tent: Tent }>> = ({ tent }) => {
  const { setModal } = useModalContext()
  const trpcCtx = trpc.useContext()
  const deleteMutation = trpc.tents.delete.useMutation({
    onSuccess() {
      setModal({} as Modal)
    },
    onSettled() {
      trpcCtx.tents.getAll.invalidate()
    },
  })

  const closePanel = () => setModal({} as Modal)

  const handleDelete = () => {
    const p = deleteMutation.mutateAsync(tent.id)
    toast.promise(p, {
      success: "Tente supprimée",
      error: getTentsErrorMessage,
      loading: "Suppression en cours ...",
    })
  }

  return (
    <>
      <Head>
        <title>{`Supprimer la tente ${tent.identifyingLabel} | MonMatos`}</title>
      </Head>
      <div className="mx-auto max-w-[450px] space-y-8 py-4">
        <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-red-500">
          <h2 className="max-w-[90px] break-words text-center text-xl font-bold text-red-500">
            {tent.identifyingLabel}
          </h2>
        </div>
        <p className="text-center text-lg font-semibold">
          Voulez-vous vraiment supprimer la tente{" "}
          <span className="text-red-500">{tent.identifyingLabel}</span> ?
        </p>
        <p className="text-center text-sm text-slate-500">
          Cette action est irréversible. L'historique des emprunts sera également supprimé.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <Button type="button" onClick={closePanel} size="sm" icon="HiArrowLeft" variant="white" className="max-w-fit">Annuler</Button>
          <Button type="button" onClick={handleDelete} disabled={deleteMutation.isLoading} size="sm" icon="HiTrash" variant="red" className="max-w-fit">
            {deleteMutation.isLoading ? "Suppression ..." : "Supprimer"}
          </Button>
        </div>
      </div>
    </>
  )
}

export default TentDeletePanel
