import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in-up">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-150" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-muted to-muted/60 border border-border/50 shadow-lg">
          <Icon className="h-9 w-9 text-muted-foreground/70" strokeWidth={1.5} />
        </div>
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(buttonVariants(), "mt-6 rounded-xl shadow-lg shadow-primary/20")}
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
