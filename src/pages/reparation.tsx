import AppLayout from "@/components/app/Layout"
import { stateColors, stateLabels } from "@/components/app/dashboard/StateChart"
import { trpc } from "@/utils/trpc"
import { sortTentLabel } from "@/utils/tentSort"
import { State } from "@prisma/client"
import classNames from "classnames"
import Head from "next/head"
import Link from "next/link"
import { ReactElement, useState } from "react"
import { toast } from "react-hot-toast"
import { NextPageWithLayout } from "./_app"

const STATES: [State, string][] = [
  ["NEUF", "Neuf"],
  ["BON", "Bon"],
  ["MAUVAIS", "Mauvais"],
  ["EN_REPARATION", "En réparation"],
  ["INUTILISABLE", "Inutilisable"],
]

const ReparationPage: NextPageWithLayout = () => {
  const { data: tents, isLoading, refetch } = trpc.tents.getAll.useQuery()
  const updateMutation = trpc.tents.update.useMutation({ onSettled: () => refetch() })
  const addTaskMutation = trpc.tents.addRepairTask.useMutation({ onSettled: () => refetch() })
  const updateTaskMutation = trpc.tents.updateRepairTask.useMutation({ onSettled: () => refetch() })
  const deleteTaskMutation = trpc.tents.deleteRepairTask.useMutation({ onSettled: () => refetch() })
  const deleteAllTasksMutation = trpc.tents.deleteAllRepairTasks.useMutation({ onSettled: () => refetch() })

  const repairTents = (tents ?? [])
    .filter((t) => t.state === "EN_REPARATION")
    .sort((a, b) => sortTentLabel(a.identifyingLabel, b.identifyingLabel, "asc"))

  const changeState = (tent: typeof repairTents[number], newState: State) => {
    if (newState !== "EN_REPARATION") {
      // Supprimer les tâches de réparation définitivement
      deleteAllTasksMutation.mutate(tent.id)
    }
    updateMutation.mutate({
      id: tent.id,
      values: {
        identifyingLabel: tent.identifyingLabel,
        state: newState,
        size: tent.size,
        integrated: tent.integrated,
        type: tent.type,
        pegs: tent.pegs ?? 0,
        complete: tent.complete,
        comments: tent.comments ?? "",
      },
    }, {
      onError: () => toast.error("Erreur lors de la mise à jour de l'état"),
    })
  }

  return (
    <>
      <Head><title>Réparations | MonMatos</title></Head>
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-4xl font-bold lg:text-5xl">
            <span>Répara</span><span className="text-emerald-600">tions</span>
          </h1>
          {repairTents.length > 0 && (
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800">
              {repairTents.length} tente{repairTents.length > 1 ? "s" : ""} en réparation
            </span>
          )}
        </div>
        <p className="text-slate-500">Tentes actuellement en réparation. Modifiez l'état pour les retirer de cette liste.</p>

        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-slate-200" />
            ))}
          </div>
        )}

        {!isLoading && repairTents.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <p className="text-2xl">🔧</p>
            <p className="text-lg font-medium">Aucune tente en réparation</p>
            <p className="text-sm">Super ! Toutes vos tentes sont en bon état.</p>
          </div>
        )}

        <div className="space-y-6">
          {repairTents.map((tent) => (
            <TentRepairCard
              key={tent.id}
              tent={tent}
              onStateChange={changeState}
              onAddTask={(tentId, desc, assignedTo) =>
                addTaskMutation.mutate({ tentId, task: { description: desc, assignedTo, done: false } })
              }
              onToggleTask={(taskId, done) =>
                updateTaskMutation.mutate({ taskId, done })
              }
              onUpdateTask={(taskId, description, assignedTo) =>
                updateTaskMutation.mutate({ taskId, description, assignedTo })
              }
              onDeleteTask={(taskId) =>
                deleteTaskMutation.mutate(taskId)
              }
            />
          ))}
        </div>
      </div>
    </>
  )
}

type RepairTent = NonNullable<ReturnType<typeof trpc.tents.getAll.useQuery>["data"]>[number]

const TentRepairCard = ({
  tent,
  onStateChange,
  onAddTask,
  onToggleTask,
  onUpdateTask,
  onDeleteTask,
}: {
  tent: RepairTent
  onStateChange: (tent: RepairTent, state: State) => void
  onAddTask: (tentId: string, desc: string, assignedTo: string) => void
  onToggleTask: (taskId: string, done: boolean) => void
  onUpdateTask: (taskId: string, description: string, assignedTo: string) => void
  onDeleteTask: (taskId: string) => void
}) => {
  const [newTask, setNewTask] = useState("")
  const [newAssignee, setNewAssignee] = useState("")
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState("")
  const [editAssignee, setEditAssignee] = useState("")

  const tasks = tent.repairTasks ?? []
  const doneCount = tasks.filter((t) => t.done).length

  const labelFontSize =
    tent.identifyingLabel.length <= 2 ? "text-2xl"
    : tent.identifyingLabel.length <= 4 ? "text-lg"
    : tent.identifyingLabel.length <= 6 ? "text-sm"
    : "text-[10px]"

  return (
    <div className="rounded-xl border border-yellow-200 bg-white shadow-sm">
      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-4 border-b border-yellow-100 bg-yellow-50 px-6 py-4 rounded-t-xl">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border-4 border-yellow-400">
          <span className={classNames("font-bold text-yellow-700", labelFontSize)}>
            {tent.identifyingLabel.slice(0, 8)}
          </span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-lg">Tente {tent.identifyingLabel}</p>
          <p className="text-sm text-slate-500">{tent.type} · {tent.size} place{tent.size > 1 ? "s" : ""}</p>
          <p className="text-xs text-slate-400">{doneCount}/{tasks.length} tâche{tasks.length > 1 ? "s" : ""} effectuée{tasks.length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Lien ce qui manque */}
          <Link
            href={`/ce-qui-manque?t=${tent.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            📋 Ce qui manque
          </Link>
          {/* Changement d'état */}
          <select
            value={tent.state}
            onChange={(e) => onStateChange(tent, e.target.value as State)}
            className={classNames(
              "rounded-md border px-3 py-1.5 text-xs font-semibold text-white outline-none cursor-pointer",
              stateColors[tent.state]
            )}
          >
            {STATES.map(([value, label]) => (
              <option key={value} value={value} className="bg-white text-slate-800">{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-6 py-4 space-y-3">
        <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Tâches de réparation</p>

        {tasks.length === 0 && (
          <p className="text-sm italic text-slate-400">Aucune tâche pour l'instant.</p>
        )}

        <ul className="space-y-2">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => onToggleTask(task.id, !task.done)}
                className="mt-1 h-4 w-4 cursor-pointer accent-emerald-500"
              />
              {editingTaskId === task.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none"
                    placeholder="Description"
                  />
                  <input
                    type="text"
                    value={editAssignee}
                    onChange={(e) => setEditAssignee(e.target.value)}
                    className="w-full rounded border border-slate-200 px-2 py-1 text-sm outline-none"
                    placeholder="Personne en charge"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { onUpdateTask(task.id, editDesc, editAssignee); setEditingTaskId(null) }}
                      className="rounded bg-emerald-500 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-600"
                    >Sauvegarder</button>
                    <button
                      onClick={() => setEditingTaskId(null)}
                      className="rounded border px-3 py-1 text-xs"
                    >Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex-1">
                  <p className={classNames("text-sm", task.done && "line-through text-slate-400")}>
                    {task.description}
                  </p>
                  {task.assignedTo && (
                    <p className="text-xs text-slate-400">👤 {task.assignedTo}</p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingTaskId(task.id); setEditDesc(task.description); setEditAssignee(task.assignedTo) }}
                  className="text-slate-400 hover:text-blue-500 text-sm"
                  title="Modifier"
                >✏️</button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="text-slate-400 hover:text-red-500 text-sm"
                  title="Supprimer"
                >🗑️</button>
              </div>
            </li>
          ))}
        </ul>

        {/* Ajout d'une tâche */}
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-slate-200 p-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nouvelle tâche (ex: Réparer le zip)"
            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm outline-none"
          />
          <input
            type="text"
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            placeholder="Personne en charge (optionnel)"
            className="w-full rounded border border-slate-200 px-3 py-1.5 text-sm outline-none"
          />
          <button
            disabled={!newTask.trim()}
            onClick={() => {
              if (!newTask.trim()) return
              onAddTask(tent.id, newTask.trim(), newAssignee.trim())
              setNewTask("")
              setNewAssignee("")
            }}
            className="rounded-md bg-slate-800 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-700"
          >
            + Ajouter la tâche
          </button>
        </div>
      </div>
    </div>
  )
}

ReparationPage.getLayout = (page: ReactElement) => (
  <AppLayout title="Réparations">{page}</AppLayout>
)

export default ReparationPage
