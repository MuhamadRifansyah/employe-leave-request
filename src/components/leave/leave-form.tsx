"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, type LeaveRequestFormData } from "@/validators/leave-validator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { employeeApi } from "@/services/employee-storage";
import type { Employee } from "@/types";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LeaveFormProps {
  onSubmit: (data: LeaveRequestFormData) => void | Promise<void>;
}

export function LeaveForm({ onSubmit }: LeaveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  useEffect(() => {
    employeeApi.getAll({ pageSize: 1000 }).then((result) => {
      setEmployees(result.data);
      setIsLoadingEmployees(false);
    }).catch(() => setIsLoadingEmployees(false));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: { employeeId: "", startDate: "", endDate: "", reason: "" },
  });

  const handleFormSubmit = async (data: LeaveRequestFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (employees.length === 0) {
    return (
      <Card className="max-w-2xl border-border/50 bg-card/80 backdrop-blur-sm animate-fade-in-up">
        <div className="p-8">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
              <AlertCircle className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold">No Employees Available</h3>
            <p className="text-sm text-muted-foreground">
              Add at least one employee before creating a leave request.
            </p>
            <Link
              href="/employees/new"
              className={cn(buttonVariants(), "mt-2 rounded-xl shadow-lg shadow-primary/20")}
            >
              Add Employee
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">New Leave Request</h2>
          <p className="text-sm text-muted-foreground mt-1">Submit a leave request for a team member.</p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="employeeId" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Employee</Label>
            <Select onValueChange={(value) => setValue("employeeId", value as string)}>
              <SelectTrigger className={cn(
                "h-11 rounded-xl bg-background/60 border-border/50",
                errors.employeeId && "border-destructive"
              )}>
                <SelectValue placeholder="Select an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} — {emp.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className={cn(
                  "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                  errors.startDate && "border-destructive"
                )}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">End Date</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className={cn(
                  "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                  errors.endDate && "border-destructive"
                )}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Describe the reason for leave..."
              rows={4}
              {...register("reason")}
              className={cn(
                "rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors resize-none",
                errors.reason && "border-destructive"
              )}
            />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border/30">
            <Link
              href="/leave"
              className={cn(buttonVariants({ variant: "ghost" }), "rounded-xl")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
