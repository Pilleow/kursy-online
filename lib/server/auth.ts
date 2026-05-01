import 'server-only'

import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import type { DefaultSession, NextAuthConfig } from 'next-auth'
import { db } from '@/lib/server/db'
import type { SchoolRole } from '@/lib/types/user'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      schoolId: string | null
      role: SchoolRole | null
      isSystemAdmin: boolean
    } & DefaultSession['user']
  }

  interface User {
    schoolId: string | null
    role: SchoolRole | null
    isSystemAdmin: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    schoolId: string | null
    role: SchoolRole | null
    isSystemAdmin: boolean
    accessTokenExpires: number
  }
}

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        schoolId: { label: 'School ID', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            memberships: credentials.schoolId
              ? { where: { schoolId: credentials.schoolId as string }, take: 1 }
              : { take: 1 },
          },
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null

        const membership = user.memberships[0] ?? null

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          schoolId: membership?.schoolId ?? null,
          role: (membership?.role as SchoolRole) ?? null,
          isSystemAdmin: user.isSystemAdmin,
        }
      },
    }),
  ],

  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },

  cookies: {
    sessionToken: {
      name: 'refresh_token',
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60,
      },
    },
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
        token.schoolId = user.schoolId
        token.role = user.role
        token.isSystemAdmin = user.isSystemAdmin
        token.jti = crypto.randomUUID()
        token.accessTokenExpires = Date.now() + 15 * 60 * 1000
        return token
      }

      if (Date.now() < token.accessTokenExpires) {
        return token
      }

      // Access token expired — rotate jti and renew window (refresh_token cookie still valid)
      token.jti = crypto.randomUUID()
      token.accessTokenExpires = Date.now() + 15 * 60 * 1000
      return token
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub as string,
          schoolId: token.schoolId,
          role: token.role,
          isSystemAdmin: token.isSystemAdmin,
        },
      }
    },
  },

  pages: {
    signIn: '/login',
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)
