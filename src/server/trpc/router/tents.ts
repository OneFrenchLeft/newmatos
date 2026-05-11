import { createTentSchema, updateTentSchema } from "@/common/validation/tents"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { authedProcedure, t } from "../trpc"

export const tentsRouter = t.router({
  getAll: authedProcedure.query(async ({ ctx }) => {
    const { session, prisma } = ctx

    const tents = await prisma.tent.findMany({
      where: { groupId: session.user.id },
      // DB-level ordering: numbers first numerically, then names alphabetically
      // We sort in JS after fetch for the smart sort logic
      include: {
        loans: {
          orderBy: { loanedAt: "desc" },
          take: 1,
        },
      },
    })

    return tents
  }),

  getById: authedProcedure.input(z.string()).query(async ({ input, ctx }) => {
    const { prisma } = ctx
    return prisma.tent.findUnique({
      where: { id: input },
      include: {
        loans: { orderBy: { loanedAt: "desc" }, take: 1 },
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
      } catch (error) {
        handleError(error)
      }
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
      } catch (error) {
        handleError(error)
      }
    }),

  delete: authedProcedure.input(z.string()).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx
    try {
      return await prisma.tent.delete({ where: { id: input } })
    } catch (error) {
      handleError(error)
    }
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
