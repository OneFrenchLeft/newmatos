import { prisma } from "@/server/db/client"
import NextAuth, { type NextAuthOptions } from "next-auth"
import Credentials from "next-auth/providers/credentials"

import { loginSchema } from "@/common/validation/auth"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        identifier: { label: "Nom du Groupe", type: "text" },
      },
      authorize: async (credentials) => {
        const creds = await loginSchema.parseAsync(credentials)

        // Allow login by group name (case-insensitive) OR by group id (for QR link login)
        const group = await prisma.group.findFirst({
          where: {
            OR: [
              { name: { equals: creds.identifier, mode: "insensitive" } },
              { id: creds.identifier },
            ],
          },
        })

        if (!group) return null

        return {
          id: group.id,
          name: group.name,
          movement: group.movement,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          movement: user.movement,
        }
      }

      return token
    },
    session: async ({ session, token: { user } }) => {
      session.user = {
        id: user.id,
        name: user.name,
        movement: user.movement,
      }

      return session
    },
  },
  jwt: {
    maxAge: 15 * 24 * 30 * 60, // 15 days
  },
  pages: {
    signIn: "/connexion",
    newUser: "/inscription",
  },
}

export default NextAuth(authOptions)
