import { TRPCError } from "@trpc/server"
import { z } from "zod"
import { authedProcedure, t } from "../trpc"

export const loansRouter = t.router({
  // Get all loans for a tent (history)
  getByTent: authedProcedure
    .input(z.string())
    .query(async ({ ctx, input: tentId }) => {
      const { prisma } = ctx
      return prisma.tentLoan.findMany({
        where: { tentId },
        orderBy: { loanedAt: "desc" },
      })
    }),

  // Create a new loan (borrow a tent)
  create: authedProcedure
    .input(
      z.object({
        tentId: z.string(),
        borrower: z.string(),
        note: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { prisma } = ctx

      // Close any open loan first
      await prisma.tentLoan.updateMany({
        where: { tentId: input.tentId, returnedAt: null },
        data: { returnedAt: new Date() },
      })

      return prisma.tentLoan.create({
        data: {
          tentId: input.tentId,
          borrower: input.borrower as any,
          note: input.note,
        },
      })
    }),

  // Return a tent (close the active loan)
  return: authedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: tentId }) => {
      const { prisma } = ctx

      const activeLoan = await prisma.tentLoan.findFirst({
        where: { tentId, returnedAt: null },
        orderBy: { loanedAt: "desc" },
      })

      if (!activeLoan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No active loan found for this tent",
        })
      }

      return prisma.tentLoan.update({
        where: { id: activeLoan.id },
        data: { returnedAt: new Date() },
      })
    }),

  // Public: get loans for a tent by tentId (no auth needed for public tent page)
  getPublicHistory: t.procedure
    .input(z.string())
    .query(async ({ ctx, input: tentId }) => {
      const { prisma } = ctx
      return prisma.tentLoan.findMany({
        where: { tentId },
        orderBy: { loanedAt: "desc" },
        take: 20,
      })
    }),
})
