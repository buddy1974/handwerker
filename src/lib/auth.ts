import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import { users, companies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { compare } from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.companyId = (user as any).companyId
        token.role = (user as any).role
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName

        const [company] = await db
          .select({ settings: companies.settings })
          .from(companies)
          .where(eq(companies.id, (user as any).companyId))
        const settings = (company?.settings as Record<string, string>) ?? {}
        token.locale = settings.locale ?? 'de'
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.companyId = token.companyId as string
        session.user.role = token.role as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.locale = (token.locale as string) ?? 'de'
      }
      return session
    },
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)
          .then((r) => r[0])

        if (!user || !user.passwordHash) return null
        if (!user.isActive) return null

        const valid = await compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          companyId: user.companyId,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      },
    }),
  ],
})
