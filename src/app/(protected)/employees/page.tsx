"use client";

import { PageHeader } from "@/components/shared/page-header";
import { EmployeeTable } from "@/components/employee/employee-table";
import { EmployeeSearch } from "@/components/employee/employee-search";
import { useEmployees } from "@/hooks/use-employees";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function EmployeesPage() {
  const {
    employees,
    searchQuery,
    isLoading,
    pagination,
    searchEmployees,
    deleteEmployee,
    goToPage,
  } = useEmployees();

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployee(id);
    } catch {
      toast.error("Failed to delete employee", {
        description: "Please try again later.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage your employee records"
        actionLabel="Add Employee"
        actionHref="/employees/new"
        actionIcon={Plus}
      />
      <EmployeeSearch onSearch={searchEmployees} />
      <EmployeeTable
        employees={employees}
        onDelete={handleDelete}
        searchQuery={searchQuery}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={goToPage}
      />
    </div>
  );
}
