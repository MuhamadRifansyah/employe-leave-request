"use client";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination } from "@/components/shared/pagination";
import type { Employee } from "@/types";
import type { PaginationMeta } from "@/services/employee-storage";
import { Pencil, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar";

interface EmployeeTableProps {
  employees: Employee[];
  onDelete: (id: string) => void;
  searchQuery?: string;
  isLoading?: boolean;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
}

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[280px]">Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(rows)].map((_, i) => (
            <TableRow key={i} className="border-border/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                </div>
              </TableCell>
              <TableCell>
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-28 rounded bg-muted animate-pulse" />
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function EmployeeTable({
  employees,
  onDelete,
  searchQuery,
  isLoading,
  pagination,
  onPageChange,
}: EmployeeTableProps) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (employees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title={searchQuery ? "No employees found" : "No employees yet"}
        description={
          searchQuery
            ? `No results for "${searchQuery}". Try a different search.`
            : "Add your first team member to get started."
        }
        actionLabel={!searchQuery ? "Add Employee" : undefined}
        actionHref={!searchQuery ? "/employees/new" : undefined}
      />
    );
  }

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-[280px]">Employee</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Position</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {employees.map((employee, idx) => (
            <TableRow
              key={employee.id}
              className="group border-border/30 hover:bg-accent/30 transition-colors duration-150"
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white text-xs font-bold shadow-sm",
                    getAvatarColor(employee.name)
                  )}>
                    {getInitials(employee.name)}
                  </div>
                  <span className="font-medium">{employee.name}</span>
                </div>
              </TableCell>
              <TableCell>
                <span className="inline-flex items-center rounded-md bg-muted/60 px-2 py-0.5 text-xs font-medium">
                  {employee.department}
                </span>
              </TableCell>
              <TableCell className="text-muted-foreground">{employee.position}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
                  <Link
                    href={`/employees/edit/${employee.id}`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 rounded-lg")}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    }
                    title="Delete Employee"
                    description={`Are you sure you want to delete "${employee.name}"? This will also remove all their leave requests. This action cannot be undone.`}
                    confirmLabel="Delete"
                    onConfirm={() => onDelete(employee.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination footer */}
      {pagination && onPageChange ? (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          onPageChange={onPageChange}
        />
      ) : (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30 bg-muted/20">
          <span className="text-xs text-muted-foreground">
            {employees.length} {employees.length === 1 ? "employee" : "employees"}
          </span>
        </div>
      )}
    </Card>
  );
}
