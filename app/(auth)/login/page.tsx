'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/lib/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import type { SchoolRole } from '@/lib/types/user';

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof LoginSchema>;

function roleToPath(role: string | null, isSystemAdmin: boolean): string {
  if (isSystemAdmin) return '/system/schools';
  if (role === 'school_admin') return '/admin/dashboard';
  if (role === 'instructor') return '/instructor/dashboard';
  return '/dashboard';
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  const form = useForm<LoginValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginValues) {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Login failed', description: data.error ?? 'An error occurred' });
        return;
      }

      queryClient.clear();
      setAuth(data.user, data.accessToken, data.user.schoolId ?? null, data.user.role as SchoolRole | null);

      router.push(roleToPath(data.user.role, data.user.isSystemAdmin ?? false));
    } catch {
      toast({ variant: 'destructive', title: 'Login failed', description: 'Network error — please try again' });
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>Enter your email and password to continue</CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" autoComplete="email" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        Don&apos;t have an account?&nbsp;
        <Link href="/register" className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </CardFooter>
    </Card>
  );
}
