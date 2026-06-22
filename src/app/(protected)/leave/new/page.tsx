"use client";

import { LeaveForm } from "@/components/leave/leave-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { leaveApi } from "@/services/leave-storage";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeaveRequestFormData } from "@/validators/leave-validator";

export default function NewLeavePage() {
  const router = useRouter();

  const handleSubmit = async (data: LeaveRequestFormData) => {
    try {
      await leaveApi.create(data);
      toast.success("Leave request submitted", {
        description: "The request is now pending approval.",
      });
      router.push("/leave");
    } catch (err) {
      toast.error("Failed to submit request", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <div>
      <Breadcrumb items={[
        { label: "Leave Requests", href: "/leave" },
        { label: "New Request" },
      ]} />
      <LeaveForm onSubmit={handleSubmit} />
    </div>
  );
}
