"use client";

import { EmployeeForm } from "@/components/employee/employee-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { employeeApi } from "@/services/employee-storage";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { EmployeeFormData } from "@/validators/employee-validator";

export default function NewEmployeePage() {
  const router = useRouter();

  const handleSubmit = async (data: EmployeeFormData) => {
    try {
      await employeeApi.create(data);
      toast.success("Employee added", {
        description: `${data.name} has been added to the team.`,
      });
      router.push("/employees");
    } catch (err) {
      toast.error("Failed to add employee", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: "Employees", href: "/employees" },
        { label: "New Employee" },
      ]} />
      <EmployeeForm onSubmit={handleSubmit} />
    </div>
  );
}
