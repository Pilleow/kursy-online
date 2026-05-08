'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { useAuthStore } from '@/lib/store/authStore'
import type { SchoolRole } from '@/lib/types/user'

const SystemLoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SystemLoginValues = z.infer<typeof SystemLoginSchema>

export default function SystemLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const setAuth = useAuthStore((s) => s.setAuth)

  const form = useForm<SystemLoginValues>({
    resolver: zodResolver(SystemLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values: SystemLoginValues) {
    try {
      const res = await fetch('/api/v1/auth/system-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      const data = await res.json()

      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Access denied',
          description: data.error ?? 'Authentication failed',
        })
        return
      }

      setAuth(data.user, data.accessToken, null, null as SchoolRole | null)
      router.push('/system/schools')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: 'Network error — please try again',
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-900 text-red-200">
          <Shield className="h-6 w-6" />
        </div>
        <div className="text-center">
          <span className="block text-2xl font-bold tracking-tight text-white">EduFlow</span>
          <span className="text-sm text-gray-400">System Administration</span>
        </div>
      </div>

      <Card className="w-full max-w-sm bg-gray-900 border-gray-800 text-gray-100 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl text-white">System login</CardTitle>
          <CardDescription className="text-gray-400">
            Restricted access — system administrators only
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="sysadmin@eduflow.dev"
                        autoComplete="email"
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white border-0"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Authenticating…' : 'Sign in'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
