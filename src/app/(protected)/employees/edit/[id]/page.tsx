"use client";

import { EmployeeForm } from "@/components/employee/employee-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { employeeApi } from "@/services/employee-storage";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { Employee } from "@/types";
import type { EmployeeFormData } from "@/validators/employee-validator";

export default function EditEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      const id = params.id as string;
      try {
        const found = await employeeApi.getById(id);
        if (found) {
          setEmployee(found);
        } else {
          toast.error("Employee not found", {
            description: "The employee record may have been deleted.",
          });
          router.push("/employees");
        }
      } catch (err) {
        console.error("Failed to fetch employee:", err);
        toast.error("Failed to load employee data");
        router.push("/employees");
      } finally {
        setLoading(false);
      }
    }
    fetchEmployee();
  }, [params.id, router]);

  const handleSubmit = async (data: EmployeeFormData) => {
    if (!employee) return;
    try {
      await employeeApi.update(employee.id, data);
      toast.success("Employee updated", {
        description: `${data.name}'s details have been saved.`,
      });
      router.push("/employees");
    } catch (err) {
      toast.error("Failed to update employee", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!employee) return null;

  return (
    <div>
      <Breadcrumb items={[
        { label: "Employees", href: "/employees" },
        { label: employee.name },
      ]} />
      <EmployeeForm
        defaultValues={{
          name: employee.name,
          department: employee.department,
          position: employee.position,
        }}
        onSubmit={handleSubmit}
        isEditing
      />
    </div>
  );
}
