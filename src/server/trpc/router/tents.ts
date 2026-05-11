import { createTentSchema, updateTentSchema } from "@/common/validation/tents"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { authedProcedure, t } from "../trpc"

const repairTaskSchema = z.object({
  description: z.string().min(1),
  assignedTo: z.string().default(""),
  done: z.boolean().default(false),
})

const checklistSchema = z.object({
  missingZip:        z.boolean(),
  missingFaitiere:   z.boolean(),
  missingDoubleToit: z.boolean(),
  missingToile:      z.boolean(),
  missingTapis:      z.boolean(),
  missingSardines:   z.boolean(),
  missingSacTente:   z.boolean(),
})

/** Champs booléens checklist partagés entre getAll et getPublic */
const CHECKLIST_SELECT = {
  missingZip:        true,
  missingFaitiere:   true,
  missingDoubleToit: true,
  missingToile:      true,
  missingTapis:      true,
  missingSardines:   true,
  missingSacTente:   true,
} as const

/** Select partagé pour les relations loans/repairTasks */
const LOAN_SELECT = {
  id: true,
  borrower: true,
  loanedAt: true,
  returnedAt: true,
  note: true,
} as const

const REPAIR_TASK_SELECT = {
  id: true,
  description: true,
  assignedTo: true,
  done: true,
  createdAt: true,
} as const

export const tentsRouter = t.router({
  getAll: authedProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx
    return prisma.tent.findMany({
      where: { groupId: session.user.id },
      select: {
        id: true,
        identifyingLabel: true,
        size: true,
        unit: true,
        state: true,
        complete: true,
        integrated: true,
        type: true,
        pegs: true,
        comments: true,
        inspectionHistory: true,
        createdAt: true,
        updatedAt: true,
        groupId: true,
        ...CHECKLIST_SELECT,
        loans: { orderBy: { loanedAt: "desc" }, take: 1, select: LOAN_SELECT },
        repairTasks: { orderBy: { createdAt: "asc" }, select: REPAIR_TASK_SELECT },
      },
    })
  }),

  getById: authedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const { prisma } = ctx
    return prisma.tent.findUnique({
      where: { id: input },
      select: {
        id: true,
        identifyingLabel: true,
        size: true,
        unit: true,
        state: true,
        complete: true,
        integrated: true,
        type: true,
        pegs: true,
        comments: true,
        inspectionHistory: true,
        createdAt: true,
        updatedAt: true,
        groupId: true,
        ...CHECKLIST_SELECT,
        loans: { orderBy: { loanedAt: "desc" }, take: 1, select: LOAN_SELECT },
        repairTasks: { orderBy: { createdAt: "asc" }, select: REPAIR_TASK_SELECT },
      },
    })
  }),

  getPublic: t.procedure.input(z.string()).query(async ({ ctx, input }) => {
    const { prisma } = ctx
    return prisma.tent.findUnique({
      where: { id: input },
      select: {
        id: true,
        identifyingLabel: true,
        type: true,
        size: true,
        state: true,
        complete: true,
        integrated: true,
        pegs: true,
        inspectionHistory: true,
        ...CHECKLIST_SELECT,
        loans: {
          orderBy: { loanedAt: "desc" },
          take: 10,
          select: LOAN_SELECT,
        },
        group: { select: { name: true, movement: true } },
      },
    })
  }),

  create: authedProcedure
    .input(createTentSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx
      try {
        return await prisma.tent.create({
          data: { ...input, groupId: session.user.id },
        })
      } catch (error) { handleError(error) }
    }),

  update: authedProcedure
    .input(updateTentSchema)
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx
      try {
        return await prisma.tent.update({
          where: { id: input.id },
          data: { ...input.values, groupId: session.user.id },
        })
      } catch (error) { handleError(error) }
    }),

  reportProblem: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      try {
        return await prisma.tent.update({
          where: { id: input.id },
          data: { state: "EN_REPARATION" },
        })
      } catch (error) { handleError(error) }
    }),

  // Met à jour les booléens checklist + recalcule complete
  updateChecklist: t.procedure
    .input(z.object({ id: z.string(), checklist: checklistSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      const hasAnyMissing = Object.values(input.checklist).some(Boolean)
      try {
        return await prisma.tent.update({
          where: { id: input.id },
          data: { ...input.checklist, complete: !hasAnyMissing },
        })
      } catch (error) { handleError(error) }
    }),

  // Met à jour l'historique de contrôle (tableau JSON de dates ISO)
  updateInspectionHistory: t.procedure
    .input(z.object({ id: z.string(), dates: z.array(z.string()) }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      try {
        return await prisma.tent.update({
          where: { id: input.id },
          data: { inspectionHistory: JSON.stringify(input.dates) },
        })
      } catch (error) { handleError(error) }
    }),

  delete: authedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx
    try {
      await prisma.repairTask.deleteMany({ where: { tentId: input } })
      return await prisma.tent.delete({ where: { id: input } })
    } catch (error) { handleError(error) }
  }),

  addRepairTask: authedProcedure
    .input(z.object({ tentId: z.string(), task: repairTaskSchema }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.repairTask.create({
        data: {
          tentId: input.tentId,
          description: input.task.description,
          assignedTo: input.task.assignedTo,
          done: input.task.done,
        },
      })
    }),

  updateRepairTask: authedProcedure
    .input(z.object({
      taskId: z.string(),
      description: z.string().optional(),
      assignedTo: z.string().optional(),
      done: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { taskId, ...data } = input
      return ctx.prisma.repairTask.update({
        where: { id: taskId },
        data,
      })
    }),

  deleteRepairTask: authedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.repairTask.delete({ where: { id: input } })
    }),

  deleteAllRepairTasks: authedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.repairTask.deleteMany({ where: { tentId: input } })
    }),
})

const handleError = (error: unknown) => {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") throw new TRPCError({ message: error.code, code: "CONFLICT" })
    if (error.code === "P2025") throw new TRPCError({ message: error.code, code: "PRECONDITION_FAILED" })
    if (error.code === "P2003") throw new TRPCError({ message: error.code, code: "PRECONDITION_FAILED" })
  }
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" })
}
