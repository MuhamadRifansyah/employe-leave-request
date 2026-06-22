"use client";

import { useState, useCallback, useEffect } from "react";
import { employeeApi, type PaginationMeta } from "@/services/employee-storage";
import type { Employee } from "@/types";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 10;

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchPage = useCallback(
    async (page: number, search?: string) => {
      try {
        setIsLoading(true);
        const result = await employeeApi.getAll({
          page,
          pageSize: pagination.pageSize,
          search: search ?? searchQuery,
        });
        setEmployees(result.data);
        setPagination(result.pagination);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
        toast.error("Failed to load employees", {
          description: "Please try again later.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, searchQuery]
  );

  // Initial fetch and refetch on search/page change
  useEffect(() => {
    fetchPage(pagination.page, searchQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    return fetchPage(pagination.page, searchQuery);
  }, [fetchPage, pagination.page, searchQuery]);

  const goToPage = useCallback(
    (page: number) => {
      fetchPage(page, searchQuery);
    },
    [fetchPage, searchQuery]
  );

  const nextPage = useCallback(() => {
    if (pagination.hasNext) goToPage(pagination.page + 1);
  }, [pagination, goToPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrev) goToPage(pagination.page - 1);
  }, [pagination, goToPage]);

  const addEmployee = useCallback(
    async (data: { name: string; department: string; position: string }) => {
      const created = await employeeApi.create(data);
      toast.success("Employee added", {
        description: `${data.name} has been added to the team.`,
      });
      await fetchPage(1, searchQuery); // Go to first page to see new entry
      return created;
    },
    [fetchPage, searchQuery]
  );

  const updateEmployee = useCallback(
    async (id: string, data: Partial<Omit<Employee, "id" | "createdAt">>) => {
      const updated = await employeeApi.update(id, data);
      toast.success("Employee updated", {
        description: `${data.name || "Employee"}'s details have been saved.`,
      });
      await refresh();
      return updated;
    },
    [refresh]
  );

  const deleteEmployee = useCallback(
    async (id: string) => {
      await employeeApi.delete(id);
      toast.success("Employee deleted", {
        description: "The employee record has been removed.",
      });
      // If current page would be empty after delete, go back one page
      const newTotal = pagination.totalCount - 1;
      const maxPage = Math.max(1, Math.ceil(newTotal / pagination.pageSize));
      const targetPage = Math.min(pagination.page, maxPage);
      await fetchPage(targetPage, searchQuery);
    },
    [fetchPage, pagination, searchQuery]
  );

  const searchEmployees = useCallback(
    (query: string) => {
      setSearchQuery(query);
      fetchPage(1, query); // Reset to page 1 on search
    },
    [fetchPage]
  );

  return {
    employees,
    searchQuery,
    isLoading,
    pagination,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    searchEmployees,
    refresh,
    goToPage,
    nextPage,
    prevPage,
    totalCount: pagination.totalCount,
  };
}
