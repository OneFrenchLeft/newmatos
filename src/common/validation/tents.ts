import { State } from "@prisma/client"
import { z } from "zod"

const stateEnum = Object.entries(State).map(([, value]) => value) as [
  State,
  ...State[],
]

const state = z.enum(stateEnum)

export const createTentSchema = z.object({
  identifyingLabel: z.string().min(1).trim(),
  size: z.number(),
  state,
  type: z.string(),
  complete: z.boolean(),
  integrated: z.boolean(),
  pegs: z.number().min(0).default(0),
  comments: z.string().optional(),
})

export const updateTentSchema = z.object({
  id: z.string(),
  values: createTentSchema,
})

export type ICreateTent = z.infer<typeof createTentSchema>
export type IUpdateTent = z.infer<typeof updateTentSchema>
