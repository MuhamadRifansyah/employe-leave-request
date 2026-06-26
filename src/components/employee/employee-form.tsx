"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { employeeSchema, type EmployeeFormData } from "@/validators/employee-validator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useFormUnsaved } from "@/hooks/use-form-unsaved";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmployeeFormProps {
  defaultValues?: EmployeeFormData;
  onSubmit: (data: EmployeeFormData) => void | Promise<void>;
  isEditing?: boolean;
}

export function EmployeeForm({ defaultValues, onSubmit, isEditing = false }: EmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues || { name: "", department: "", position: "" },
  });

  useFormUnsaved(isDirty);

  const handleFormSubmit = async (data: EmployeeFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEditing ? "Edit Employee" : "New Employee"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {isEditing ? "Update the employee details below." : "Fill in the details to add a new team member."}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              {...register("name")}
              className={cn(
                "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                errors.name && "border-destructive"
              )}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="department" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Department</Label>
            <Input
              id="department"
              placeholder="e.g. Engineering"
              {...register("department")}
              className={cn(
                "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                errors.department && "border-destructive"
              )}
            />
            {errors.department && <p className="text-xs text-destructive">{errors.department.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Position</Label>
            <Input
              id="position"
              placeholder="e.g. Senior Developer"
              {...register("position")}
              className={cn(
                "h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors",
                errors.position && "border-destructive"
              )}
            />
            {errors.position && <p className="text-xs text-destructive">{errors.position.message}</p>}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border/30">
            <Link
              href="/employees"
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
              {isEditing ? "Save Changes" : "Add Employee"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
