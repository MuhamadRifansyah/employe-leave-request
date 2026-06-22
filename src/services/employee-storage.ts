import type { Employee } from "@/types";
import { fetchJson } from "@/lib/api-client";

const BASE_URL = "/api/employees";

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const employeeApi = {
  async getAll(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }): Promise<PaginatedResult<Employee>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
    if (params?.search) searchParams.set("search", params.search);

    const qs = searchParams.toString();
    const url = qs ? `${BASE_URL}?${qs}` : BASE_URL;
    return fetchJson<PaginatedResult<Employee>>(url);
  },

  async getById(id: string): Promise<Employee | undefined> {
    try {
      const { data } = await fetchJson<{ data: Employee }>(`${BASE_URL}/${id}`);
      return data;
    } catch {
      return undefined;
    }
  },

  async create(data: { name: string; department: string; position: string }): Promise<Employee> {
    const { data: created } = await fetchJson<{ data: Employee }>(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return created;
  },

  async update(id: string, data: Partial<Omit<Employee, "id" | "createdAt">>): Promise<Employee> {
    const { data: updated } = await fetchJson<{ data: Employee }>(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return updated;
  },

  async delete(id: string): Promise<void> {
    await fetchJson(`${BASE_URL}/${id}`, { method: "DELETE" });
  },
};
