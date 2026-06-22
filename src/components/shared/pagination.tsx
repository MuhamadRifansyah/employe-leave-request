"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function Pagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  hasNext,
  hasPrev,
  onPageChange,
  isLoading,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Generate visible page numbers (always show first, last, and up to 2 around current)
  const pages: (number | "dots")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "dots") {
      pages.push("dots");
    }
  }

  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border/30 bg-muted/20">
      <span className="text-xs text-muted-foreground tabular-nums">
        Showing {startItem}–{endItem} of {totalCount} {totalCount === 1 ? "employee" : "employees"}
      </span>

      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(1)}
          disabled={!hasPrev || isLoading}
        >
          <ChevronsLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Previous */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrev || isLoading}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        {/* Page numbers */}
        {pages.map((p, idx) =>
          p === "dots" ? (
            <span
              key={`dots-${idx}`}
              className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground"
            >
              ···
            </span>
          ) : (
            <Button
              key={p}
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg text-xs font-medium transition-all duration-200",
                p === page
                  ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onPageChange(p)}
              disabled={isLoading}
            >
              {p}
            </Button>
          )
        )}

        {/* Next */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNext || isLoading}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg"
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNext || isLoading}
        >
          <ChevronsRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
