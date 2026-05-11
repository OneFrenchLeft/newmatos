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

        // Try login by group id first (QR link login)
        const groupById = await prisma.group.findFirst({
          where: { id: creds.identifier },
        })

        if (groupById) {
          return {
            id: groupById.id,
            name: groupById.name,
            movement: groupById.movement,
          }
        }

        // Fallback: case-insensitive name search (compatible with SQLite)
        const allGroups = await prisma.group.findMany({
          select: { id: true, name: true, movement: true },
        })

        const group = allGroups.find(
          (g) => g.name.toLowerCase() === creds.identifier.toLowerCase()
        )

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
