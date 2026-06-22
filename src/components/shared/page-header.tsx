import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  actionIcon?: LucideIcon;
}

export function PageHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  actionIcon: ActionIcon,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className={cn(
            buttonVariants(),
            "mt-3 sm:mt-0 rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          )}
        >
          {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
