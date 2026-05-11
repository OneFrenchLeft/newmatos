import { registerSchema } from "@/common/validation/auth"
import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { authedProcedure, t } from "../trpc"

export const groupRouter = t.router({
  create: t.procedure.input(registerSchema).mutation(async ({ ctx, input }) => {
    const { prisma } = ctx

    // Anti-doublon : vérifier si le groupe existe déjà
    const existing = await prisma.group.findUnique({
      where: { name: input.name },
    })
    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Un groupe avec ce nom existe déjà. Veuillez vous connecter à la place.",
      })
    }

    const group = await prisma.group.create({
      data: input,
    })

    return group.id
  }),

  delete: authedProcedure
    .input(z.object({ confirmation: z.literal("SUPPRIMER") }))
    .mutation(async ({ ctx }) => {
      const { prisma, session } = ctx
      const groupId = session.user.id

      // Supprimer d'abord tous les emprunts des tentes du groupe
      const tents = await prisma.tent.findMany({ where: { groupId } })
      const tentIds = tents.map((t) => t.id)
      await prisma.tentLoan.deleteMany({ where: { tentId: { in: tentIds } } })

      // Supprimer les tentes
      await prisma.tent.deleteMany({ where: { groupId } })

      // Supprimer le groupe
      await prisma.group.delete({ where: { id: groupId } })

      return { success: true }
    }),

  importTents: authedProcedure
    .input(
      z.array(
        z.object({
          identifyingLabel: z.string().min(1),
          size: z.number(),
          type: z.string(),
          integrated: z.boolean(),
          state: z.string(),
          complete: z.boolean(),
          pegs: z.number(),
          comments: z.string(),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma, session } = ctx
      const groupId = session.user.id

      const results = await Promise.all(
        input.map((tent) =>
          prisma.tent.upsert({
            where: {
              TentIdentifier: {
                groupId,
                identifyingLabel: tent.identifyingLabel,
              },
            },
            update: {
              size: tent.size,
              type: tent.type,
              integrated: tent.integrated,
              state: tent.state as any,
              complete: tent.complete,
              pegs: tent.pegs,
              comments: tent.comments,
            },
            create: {
              identifyingLabel: tent.identifyingLabel,
              size: tent.size,
              type: tent.type,
              integrated: tent.integrated,
              state: tent.state as any,
              complete: tent.complete,
              pegs: tent.pegs,
              comments: tent.comments,
              groupId,
            },
          }),
        ),
      )

      return { imported: results.length }
    }),
})
