"use client";

import { LeaveForm } from "@/components/leave/leave-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { leaveApi } from "@/services/leave-storage";
import { employeeApi } from "@/services/employee-storage";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { LeaveRequestFormData } from "@/validators/leave-validator";

export default function NewMyLeavePage() {
  const router = useRouter();
  const { session } = useAuth();
  const [myEmployeeId, setMyEmployeeId] = useState<string | null>(null);
  const [myEmployeeName, setMyEmployeeName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Find the employee record that maps to the current auth user
  useEffect(() => {
    async function findEmployee() {
      if (!session) return;
      try {
        const result = await employeeApi.getAll({ pageSize: 1000 });
        const match = result.data.find(
          (e) =>
            e.name.toLowerCase() === session.displayName.toLowerCase() ||
            e.name.toLowerCase() === session.username.toLowerCase()
        );
        if (match) {
          setMyEmployeeId(match.id);
          setMyEmployeeName(match.name);
        } else {
          toast.error("Employee profile not found", {
            description: "Your account is not linked to an employee profile.",
          });
        }
      } catch {
        toast.error("Failed to load employee data");
      } finally {
        setIsLoading(false);
      }
    }
    findEmployee();
  }, [session]);

  const handleSubmit = async (data: LeaveRequestFormData) => {
    try {
      await leaveApi.create(data);
      toast.success("Leave request submitted successfully");
      router.push("/my-leave");
    } catch (err) {
      toast.error("Failed to submit leave request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!myEmployeeId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <h3 className="text-lg font-semibold">No employee profile linked</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Your account is not linked to an employee profile. Contact your administrator.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[
        { label: "My Leave", href: "/my-leave" },
        { label: "New Request" },
      ]} />
      <LeaveForm
        onSubmit={handleSubmit}
        backHref="/my-leave"
        fixedEmployeeId={myEmployeeId}
        fixedEmployeeName={myEmployeeName}
      />
    </div>
  );
}
