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
  zip: z.boolean(),
  faitiere: z.boolean(),
  doubleToit: z.boolean(),
  toile: z.boolean(),
  tapis: z.boolean(),
  sardines: z.boolean(),
  sacTente: z.boolean(),
})

export const tentsRouter = t.router({
  getAll: authedProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx
    return prisma.tent.findMany({
      where: { groupId: session.user.id },
      include: {
        loans: { orderBy: { loanedAt: "desc" }, take: 1 },
        repairTasks: { orderBy: { createdAt: "asc" } },
      },
    })
  }),

  getById: authedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const { prisma } = ctx
    return prisma.tent.findUnique({
      where: { id: input },
      include: {
        loans: { orderBy: { loanedAt: "desc" }, take: 1 },
        repairTasks: { orderBy: { createdAt: "asc" } },
      },
    })
  }),

  getPublic: t.procedure.input(z.string()).query(async ({ ctx, input }) => {
    const { prisma } = ctx
    return prisma.tent.findUnique({
      where: { id: input },
      include: {
        loans: { orderBy: { loanedAt: "desc" }, take: 10 },
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

  // Mutation publique — stocke la checklist dans missingItems (champ dédié)
  updateChecklist: t.procedure
    .input(z.object({ id: z.string(), checklist: checklistSchema }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx
      const hasAnyMissing = Object.values(input.checklist).some(Boolean)
      try {
        return await prisma.tent.update({
          where: { id: input.id },
          data: {
            missingItems: JSON.stringify(input.checklist),
            complete: !hasAnyMissing,
          },
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
