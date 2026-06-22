"use client";

import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface EmployeeSearchProps {
  onSearch: (query: string) => void;
}

export function EmployeeSearch({ onSearch }: EmployeeSearchProps) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div className={cn(
      "relative max-w-md transition-all duration-300",
      focused && "max-w-lg"
    )}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        placeholder="Search employees..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "pl-10 pr-20 h-10 rounded-xl border-border/50 bg-card/60 backdrop-blur-sm",
          "focus:bg-card focus:shadow-lg focus:shadow-primary/5 transition-all duration-300"
        )}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
        {value ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-md"
            onClick={() => setValue("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        )}
      </div>
    </div>
  );
}
