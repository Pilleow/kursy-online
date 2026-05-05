import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, SchoolRole } from '@/lib/types/user'

type AuthState = {
  user: User | null
  accessToken: string | null
  schoolId: string | null
  role: SchoolRole | null
  isSystemAdmin: boolean
}

type AuthActions = {
  setAuth: (user: User, token: string, schoolId: string | null, role: SchoolRole | null) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      schoolId: null,
      role: null,
      isSystemAdmin: false,

      setAuth: (user, token, schoolId, role) =>
        set({
          user,
          accessToken: token,
          schoolId,
          role,
          isSystemAdmin: user.isSystemAdmin ?? false,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          schoolId: null,
          role: null,
          isSystemAdmin: false,
        }),
    }),
    { name: 'auth' }
  )
)
