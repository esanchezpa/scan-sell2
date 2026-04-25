import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Mobile-first responsive shell. On larger screens, content stays centered
 * in a phone-like column for a focused POS experience.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl pb-28 pt-2 sm:pt-4">{children}</div>
      <BottomNav />
    </div>
  );
}
