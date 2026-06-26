"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/validators/auth-validator";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Sparkles, FileCheck } from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginErrorHandler() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "expired") {
      toast.error("Session expired", {
        description: "Your session has expired. Please sign in again.",
      });
    } else if (error === "idle") {
      toast.warning("Logged out due to inactivity", {
        description: "You were inactive for too long. Please sign in again.",
      });
    }
  }, [searchParams]);
  return null;
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.username, data.password);
      if (!result.success) {
        toast.error("Login failed", {
          description: result.error || "Please check your credentials.",
        });
      } else {
        toast.success("Welcome back!", {
          description: "You have been logged in successfully.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden">
      <Suspense fallback={null}>
        <LoginErrorHandler />
      </Suspense>
      {/* Animated gradient background */}
      <div className="absolute inset-0 gradient-mesh" />
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      {/* Decorative orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl animate-pulse delay-1000" style={{ animationDelay: "2s" }} />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 animate-fade-in-up">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-2xl shadow-primary/30 mb-5">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Leavely</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Employee Leave Management Platform</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl shadow-black/5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Username</Label>
              <Input
                id="username"
                placeholder="Enter your username"
                autoComplete="username"
                {...register("username")}
                className={`h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors ${errors.username ? "border-destructive" : ""}`}
              />
              {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register("password")}
                className={`h-11 rounded-xl bg-background/60 border-border/50 focus:bg-background transition-colors ${errors.password ? "border-destructive" : ""}`}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl mt-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Sign In
            </Button>
          </form>
        </div>

        {/* Report Link */}
        <div className="flex justify-center mt-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <Link href="/report">
            <Button variant="outline" className="rounded-xl gap-2 bg-background/40 border-border/50 backdrop-blur-sm hover:bg-background/60 transition-all">
              <FileCheck className="h-4 w-4" />
              View Audit Report
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}
