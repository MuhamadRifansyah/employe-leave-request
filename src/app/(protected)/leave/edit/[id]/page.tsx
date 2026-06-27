"use client";

import { LeaveEditForm } from "@/components/leave/leave-edit-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { leaveApi } from "@/services/leave-storage";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { LeaveRequest } from "@/types";
import type { LeaveEditFormData } from "@/validators/leave-validator";

export default function EditLeavePage() {
  const router = useRouter();
  const params = useParams();
  const { isAdmin, isManager, session } = useAuth();
  const [request, setRequest] = useState<(LeaveRequest & { employee?: { name: string; department: string; leaveBalance: number } }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      const id = params.id as string;
      try {
        const found = await leaveApi.getById(id);
        if (found) {
          // IDOR check: employees can only view their own leave requests
          if (!isAdmin && !isManager && session) {
            const ownerName = found.employee?.name?.toLowerCase();
            const userName = session.displayName?.toLowerCase();
            const userLogin = session.username?.toLowerCase();
            if (ownerName !== userName && ownerName !== userLogin) {
              toast.error("You can only view your own leave requests");
              router.push("/my-leave");
              return;
            }
          }
          setRequest(found);
        } else {
          toast.error("Leave request not found");
          router.push("/leave");
        }
      } catch (err) {
        console.error("Failed to fetch leave request:", err);
        toast.error("Failed to load leave request");
        router.push("/leave");
      } finally {
        setLoading(false);
      }
    }
    fetchRequest();
  }, [params.id, router, isAdmin, isManager, session]);

  const canEdit = request?.status === "PENDING";
  const canCancel = request?.status === "PENDING";

  const handleSubmit = async (data: LeaveEditFormData) => {
    if (!request) return;
    try {
      await leaveApi.updateFields(request.id, data);
      toast.success("Leave request updated", {
        description: "The request details have been saved.",
      });
      router.push("/leave");
    } catch (err) {
      toast.error("Failed to update request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    try {
      await leaveApi.updateStatus(request.id, "CANCELLED");
      toast.success("Leave request cancelled");
      router.push("/leave");
    } catch (err) {
      toast.error("Failed to cancel request", {
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

  if (!request) return null;

  return (
    <div>
      <Breadcrumb items={[
        { label: "Leave Requests", href: "/leave" },
        { label: canEdit ? "Edit Request" : "View Request" },
      ]} />
      <LeaveEditForm
        request={request}
        employeeName={request.employee?.name || "Unknown"}
        employeeDepartment={request.employee?.department || "\u2014"}
        leaveBalance={request.employee?.leaveBalance ?? 12}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        backHref="/leave"
        canEdit={canEdit}
        canCancel={canCancel}
      />
    </div>
  );
}
