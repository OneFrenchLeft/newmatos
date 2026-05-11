import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Icon from "@/components/ui/Icon"
import Panel from "@/components/ui/Panel"
import { downloadExcel, parseImportedExcel } from "@/utils/downloadFns"
import { UIProps } from "@/utils/typedProps"
import { Tent } from "@prisma/client"
import { FC, useRef } from "react"
import { toast } from "react-hot-toast"
import { useGroup } from "../../hooks/useGroup"
import { trpc } from "@/utils/trpc"

const ActionsPanel: FC<UIProps<{ tents: Tent[] }>> = ({ tents }) => {
  const { movement } = useGroup()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const trpcCtx = trpc.useContext()
  const importMutation = trpc.group.importTents.useMutation({
    onSuccess(data) {
      trpcCtx.tents.getAll.invalidate()
      toast.success(`${data.imported} tente(s) import\u00e9e(s) avec succ\u00e8s`)
    },
    onError(err) {
      toast.error(err.message || "Erreur lors de l'import")
    },
  })

  const handleImportClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ""
    try {
      const parsed = await parseImportedExcel(file)
      await importMutation.mutateAsync(parsed)
    } catch (err: any) {
      toast.error(err?.message || "Format de fichier invalide")
    }
  }

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
            <ButtonLink href="/tentes?t=add" variant="black" size="sm" icon="BsPlusLg">Ajouter une tente</ButtonLink>
            <ButtonLink href="/tentes" variant="white" icon="TiThList" size="sm">Parcourir les tentes</ButtonLink>
            <ButtonLink href="/ce-qui-manque" variant="white" icon="MdOutlineErrorOutline" size="sm">Ce qui manque</ButtonLink>
            <ButtonLink href="/reparation" variant="white" icon="FaWrench" size="sm">R\u00e9parations en cours</ButtonLink>
            <Button type="button" icon="RiFileExcel2Fill" size="sm" onClick={downloadExcel(tents, movement)}>Exporter en .xlsx</Button>
            <Button
              type="button" icon="RiFileExcel2Fill" size="sm" variant="white"
              onClick={handleImportClick} disabled={importMutation.isLoading}
            >
              {importMutation.isLoading ? "Import en cours..." : "Importer un .xlsx"}
            </Button>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
          </div>
        </div>
        <div className="mx-auto mt-10 w-full max-w-[350px] space-y-3 border-t border-red-200 pt-6">
          <h3 className="ml-2 flex items-center space-x-2 self-start text-xl font-semibold text-red-600">
            <Icon name="MdDeleteForever" />
            <span>Danger</span>
          </h3>
          <DeleteGroupButton />
        </div>
      </div>
    </Panel>
  )
}

const DeleteGroupButton: FC = () => {
  const deleteMutation = trpc.group.delete.useMutation({
    onSuccess() { window.location.href = "/" },
    onError(err) { toast.error(err.message || "Erreur lors de la suppression") },
  })

  const handleDelete = () => {
    const answer = window.prompt(
      'Pour confirmer la suppression d\u00e9finitive de votre groupe et de toutes ses tentes, tapez exactement : SUPPRIMER',
    )
    if (answer !== "SUPPRIMER") {
      if (answer !== null) toast.error("Confirmation incorrecte. Suppression annul\u00e9e.")
      return
    }
    toast.promise(
      deleteMutation.mutateAsync({ confirmation: "SUPPRIMER" }),
      { loading: "Suppression en cours...", success: "Groupe supprim\u00e9", error: "Erreur lors de la suppression" },
    )
  }

  return (
    <Button
      type="button" size="sm" variant="white"
      onClick={handleDelete} disabled={deleteMutation.isLoading}
      className="w-full border border-red-300 text-red-600 hover:bg-red-50"
    >
      {deleteMutation.isLoading ? "Suppression..." : "Supprimer le groupe"}
    </Button>
  )
}

export default ActionsPanel
