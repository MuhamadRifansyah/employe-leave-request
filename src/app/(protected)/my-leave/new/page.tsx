"use client";

import { LeaveForm } from "@/components/leave/leave-form";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { leaveApi } from "@/services/leave-storage";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { LeaveRequestFormData } from "@/validators/leave-validator";

export default function NewMyLeavePage() {
  const router = useRouter();

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

  return (
    <div>
      <Breadcrumb items={[
        { label: "My Leave", href: "/my-leave" },
        { label: "New Request" },
      ]} />
      <LeaveForm onSubmit={handleSubmit} />
    </div>
  );
}
