import { ArrowLeft } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}

export function PageHeader({ title, subtitle, back, right }: PageHeaderProps) {
  const router = useRouter();
  return (
    <header className="flex items-start justify-between gap-3 px-5 pb-4 pt-4">
      <div className="flex items-start gap-3">
        {back && (
          <button
            onClick={() => router.history.back()}
            aria-label="Volver"
            className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-primary-soft-foreground transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </header>
  );
}
