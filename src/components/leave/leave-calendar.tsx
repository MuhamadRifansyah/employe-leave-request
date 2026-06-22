"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay
} from "date-fns";
import type { LeaveRequest, Employee } from "@/types";
import { cn } from "@/lib/utils";

interface LeaveCalendarProps {
  leaveRequests: LeaveRequest[];
  employees: Employee[];
}

export function LeaveCalendar({ leaveRequests, employees }: LeaveCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const employeeMap = useMemo(() => {
    return employees.reduce((acc, emp) => {
      acc[emp.id] = emp;
      return acc;
    }, {} as Record<string, Employee>);
  }, [employees]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getLeavesForDay = (date: Date) => {
    return leaveRequests.filter(request => {
      const start = startOfDay(parseISO(request.startDate));
      const end = endOfDay(parseISO(request.endDate));
      return isWithinInterval(date, { start, end });
    });
  };

  const statusColors = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    REJECTED: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    CANCELLED: "bg-slate-500/20 border-slate-500/30 text-slate-700 dark:text-slate-400",
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden animate-fade-in-up">
      <div className="p-4 flex items-center justify-between border-b border-border/30 bg-muted/20">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold">{format(currentDate, "MMMM yyyy")}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8 rounded-lg text-xs">
            Today
          </Button>
          <div className="flex items-center gap-1 bg-background/50 rounded-lg border border-border/50 p-0.5">
            <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7 rounded-md">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7 rounded-md">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 bg-muted/10 border-b border-border/30">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="py-2.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-border/20 gap-px">
        {days.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isTodayDate = isToday(day);
          const dayLeaves = getLeavesForDay(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[120px] bg-card p-2 transition-colors hover:bg-muted/10",
                !isCurrentMonth && "bg-muted/5 opacity-50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                    isTodayDate
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-foreground/70"
                  )}
                >
                  {format(day, "d")}
                </span>
                {dayLeaves.length > 0 && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {dayLeaves.length}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
                {dayLeaves.map((leave) => {
                  const emp = employeeMap[leave.employeeId];
                  return (
                    <div
                      key={leave.id}
                      className={cn(
                        "truncate rounded border px-1.5 py-1 text-[10px] font-medium transition-colors",
                        statusColors[leave.status as keyof typeof statusColors]
                      )}
                      title={`${emp?.name} - ${leave.reason}`}
                    >
                      {emp?.name?.split(" ")[0] || "Unknown"}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
