import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground text-2xl font-bold select-none">
          E
        </div>
        <span className="text-2xl font-bold tracking-tight">EduFlow</span>
      </div>
      {children}
    </div>
  );
}
