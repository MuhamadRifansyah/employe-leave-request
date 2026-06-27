"use client";

import { useAuth } from "@/hooks/use-auth";
import { ROLE_LABELS, DEFAULT_LEAVE_BALANCE } from "@/constants";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle,
  Mail,
  Shield,
  Clock,
  Pencil,
  Lock,
  Camera,
  Save,
  X,
  Building2,
  Briefcase,
  Wallet,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { leaveApi } from "@/services/leave-storage";
import { employeeApi } from "@/services/employee-storage";
import { userStorage } from "@/services/user-storage";

import { saveSession, getSession } from "@/lib/session";
import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Employee } from "@/types";

/* ─────────────── Avatar Component ─────────────── */

function AvatarUpload({
  initials,
  avatarUrl,
  onUpload,
}: {
  initials: string;
  avatarUrl: string | null;
  onUpload: (url: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Invalid file type", { description: "Please select an image file." });
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large", { description: "Maximum file size is 2MB." });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        onUpload(result);
        toast.success("Avatar updated");
      };
      reader.readAsDataURL(file);
    },
    [onUpload]
  );

  return (
    <div className="relative group">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Profile avatar"
          className="h-24 w-24 rounded-2xl object-cover shadow-xl shadow-primary/20 ring-4 ring-background"
        />
      ) : (
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-3xl font-bold shadow-xl shadow-primary/25 ring-4 ring-background">
          {initials}
        </div>
      )}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
      >
        <Camera className="h-3.5 w-3.5" />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}

/* ─────────────── Profile Form ─────────────── */

function ProfileEditForm({
  displayName: initialName,
  email: initialEmail,
  userId,
  employeeId,
  onSave,
}: {
  displayName: string;
  email: string;
  userId: string;
  employeeId?: string;
  onSave: (name: string, email: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Display name is required");
      return;
    }
    setIsSaving(true);
    try {
      userStorage.update(userId, { displayName: name.trim(), email: email.trim() });

      // Update the session with new displayName
      const currentSession = getSession();
      if (currentSession) {
        currentSession.displayName = name.trim();
        saveSession(currentSession);
      }

      // Sync name to employee record in DB so user↔employee matching stays intact
      if (employeeId && name.trim() !== initialName) {
        try {
          await employeeApi.update(employeeId, { name: name.trim() });
        } catch {
          // Non-fatal: localStorage is updated, DB sync failed
          console.error("Failed to sync employee name to DB");
        }
      }

      onSave(name.trim(), email.trim());
      setIsEditing(false);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(initialName);
    setEmail(initialEmail);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsEditing(true)}
        className="rounded-xl gap-1.5 text-xs h-8"
      >
        <Pencil className="h-3 w-3" />
        Edit Profile
      </Button>
    );
  }

  return (
    <div className="space-y-4 mt-4 p-4 rounded-xl bg-muted/20 border border-border/30 animate-fade-in-up">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Display Name
          </Label>
          <Input
            id="displayName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 rounded-xl bg-background/60 border-border/50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 rounded-xl bg-background/60 border-border/50"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-xl gap-1.5 text-xs h-8 shadow-lg shadow-primary/20"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={handleCancel} className="rounded-xl gap-1.5 text-xs h-8">
          <X className="h-3 w-3" />
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ─────────────── Change Password (Disabled — Server-side Auth) ─────────────── */

function ChangePasswordForm({ userId: _userId }: { userId: string }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled
        className="rounded-xl gap-1.5 text-xs h-8 opacity-60"
      >
        <Lock className="h-3 w-3" />
        Change Password
      </Button>
      <span className="text-xs text-muted-foreground">
        Managed by administrator
      </span>
    </div>
  );
}

/* ─────────────── Leave Balance Card ─────────────── */

function LeaveBalanceCard({
  balance,
  totalRequests,
  approved,
  pending,
  rejected,
  cancelled,
  daysUsed,
}: {
  balance: number;
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
  cancelled: number;
  daysUsed: number;
}) {
  const initialBalance = DEFAULT_LEAVE_BALANCE;
  const usedPercent = initialBalance > 0 ? Math.round(((initialBalance - balance) / initialBalance) * 100) : 0;

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/25">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-sm font-semibold">Leave Balance</h3>
        </div>

        {/* Balance display */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className={cn(
            "text-4xl font-bold tabular-nums",
            balance <= 3 ? "text-amber-500" : "text-emerald-500"
          )}>
            {balance}
          </span>
          <span className="text-sm text-muted-foreground">/ {initialBalance} days remaining</span>
        </div>

        {/* Usage bar */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Used</span>
            <span className="font-semibold tabular-nums">{daysUsed}d ({usedPercent}%)</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                usedPercent > 75
                  ? "bg-gradient-to-r from-rose-500 to-red-500"
                  : usedPercent > 50
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : "bg-gradient-to-r from-emerald-500 to-teal-500"
              )}
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Request stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
          {[
            { label: "Total", value: totalRequests, color: "text-foreground" },
            { label: "Approved", value: approved, color: "text-emerald-500" },
            { label: "Pending", value: pending, color: "text-amber-500" },
            { label: "Rejected", value: rejected, color: "text-rose-500" },
            { label: "Cancelled", value: cancelled, color: "text-slate-500" },
          ].map((s) => (
            <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
              <p className={cn("text-lg font-bold tabular-nums", s.color)}>{s.value}</p>
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/* ─────────────── Main Page ─────────────── */

const AVATAR_STORAGE_KEY = "lms_profile_avatar";

export default function ProfilePage() {
  const { session } = useAuth();

  const [displayName, setDisplayName] = useState(session?.displayName || "User");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveBalance, setLeaveBalance] = useState(DEFAULT_LEAVE_BALANCE);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, cancelled: 0, daysUsed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setDisplayName(session.displayName);

    // Load user data from userStorage
    const user = userStorage.getById(session.userId);
    if (user) {
      setEmail(user.email);
    }

    // Load avatar from localStorage
    if (typeof window !== "undefined") {
      const storedAvatar = localStorage.getItem(`${AVATAR_STORAGE_KEY}_${session.userId}`);
      if (storedAvatar) setAvatarUrl(storedAvatar);
    }

    // Load employee and leave data
    async function fetchData() {
      try {
        const result = await employeeApi.getAll({ pageSize: 1000 });
        const allEmployees = result.data;
        const emp = allEmployees.find(
          (e) =>
            e.name.toLowerCase() === session!.displayName.toLowerCase() ||
            e.name.toLowerCase() === session!.username.toLowerCase()
        );

        if (emp) {
          setEmployee(emp);
          setLeaveBalance(emp.leaveBalance ?? DEFAULT_LEAVE_BALANCE);

          const leaves = await leaveApi.getByEmployeeId(emp.id);
          const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
          const daysUsed = approvedLeaves.reduce((sum, l) => {
            const start = new Date(l.startDate);
            const end = new Date(l.endDate);
            return sum + Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1;
          }, 0);

          setStats({
            total: leaves.length,
            pending: leaves.filter((l) => l.status === "PENDING").length,
            approved: approvedLeaves.length,
            rejected: leaves.filter((l) => l.status === "REJECTED").length,
            cancelled: leaves.filter((l) => l.status === "CANCELLED").length,
            daysUsed,
          });
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [session]);

  const handleAvatarUpload = useCallback(
    (url: string) => {
      setAvatarUrl(url);
      if (session && typeof window !== "undefined") {
        localStorage.setItem(`${AVATAR_STORAGE_KEY}_${session.userId}`, url);
      }
    },
    [session]
  );

  const handleProfileSave = useCallback((name: string, newEmail: string) => {
    setDisplayName(name);
    setEmail(newEmail);
  }, []);

  const roleLabel = session?.role ? ROLE_LABELS[session.role] : "Employee";
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const profileFields = [
    { icon: UserCircle, label: "Username", value: session?.username || "—" },
    { icon: Mail, label: "Email", value: email || `${session?.username || "user"}@leavely.app` },
    { icon: Shield, label: "Role", value: roleLabel },
    { icon: Clock, label: "Member Since", value: new Date(employee?.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long" }) },
  ];

  const employeeFields = employee
    ? [
        { icon: Briefcase, label: "Position", value: employee.position },
        { icon: Building2, label: "Department", value: employee.department },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Profile" subtitle="Your account information" />
        <div className="h-64 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card/80 border border-border/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" subtitle="Your account information" />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
            <div className="p-6 sm:p-8">
              {/* Header: Avatar + Name + Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <AvatarUpload
                  initials={initials}
                  avatarUrl={avatarUrl}
                  onUpload={handleAvatarUpload}
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold tracking-tight">{displayName}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{roleLabel}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active
                    </span>
                    {employee && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary border border-primary/20">
                        {employee.department}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              {/* Personal Information */}
              <div className="mb-5">
                <h3 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-primary" />
                  Personal Information
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[...profileFields, ...employeeFields].map((field) => (
                    <div key={field.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <field.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{field.label}</p>
                        <p className="text-sm font-medium truncate">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-0">
                <Separator className="mb-5" />
                <div className="flex flex-wrap items-center gap-2">
                  <ProfileEditForm
                    displayName={displayName}
                    email={email}
                    userId={session?.userId || ""}
                    employeeId={employee?.id}
                    onSave={handleProfileSave}
                  />
                  <ChangePasswordForm userId={session?.userId || ""} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Leave Balance */}
        <div className="space-y-6">
          <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <LeaveBalanceCard
              balance={leaveBalance}
              totalRequests={stats.total}
              approved={stats.approved}
              pending={stats.pending}
              rejected={stats.rejected}
              cancelled={stats.cancelled}
              daysUsed={stats.daysUsed}
            />
          </div>

          {/* Quick Info */}
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm p-5 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <h3 className="text-sm font-semibold tracking-tight mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Account Security
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Password</span>
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle className="h-3 w-3" /> Set
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Session</span>
                <span className="text-foreground font-medium">
                  {session?.loginAt
                    ? new Date(session.loginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "Active"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Expires</span>
                <span className="text-foreground font-medium">
                  {session?.expiresAt
                    ? new Date(session.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                    : "—"}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
