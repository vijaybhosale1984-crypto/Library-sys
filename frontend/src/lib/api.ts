import axios from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({ baseURL: BASE });

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  genre?: string;
  total_copies: number;
  avail_copies: number;
  published_year?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  member_since: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  book_title?: string;
  member_name?: string;
  borrowed_at: string;
  due_date: string;
  returned_at?: string;
  fine_amount: number;
  status: "active" | "returned" | "overdue";
}

export interface DashboardStats {
  total_books: number;
  total_members: number;
  active_loans: number;
  overdue_loans: number;
  total_fines: number;
}

export interface Paginated<T> {
  total: number;
  [key: string]: T[] | number;
}

// ─── Books ─────────────────────────────────────────────────────────────────

export const booksApi = {
  list: (p = 1, perPage = 20, search = "") =>
    api.get<{ books: Book[]; total: number }>("/books/", { params: { page: p, per_page: perPage, search } }),
  get:    (id: number) => api.get<Book>(`/books/${id}`),
  create: (data: Partial<Book>) => api.post<Book>("/books/", data),
  update: (id: number, data: Partial<Book>) => api.put<Book>(`/books/${id}`, data),
  delete: (id: number) => api.delete(`/books/${id}`),
};

// ─── Members ───────────────────────────────────────────────────────────────

export const membersApi = {
  list: (p = 1, perPage = 20, search = "") =>
    api.get<{ members: Member[]; total: number }>("/members/", { params: { page: p, per_page: perPage, search } }),
  get:    (id: number) => api.get<Member>(`/members/${id}`),
  create: (data: Partial<Member>) => api.post<Member>("/members/", data),
  update: (id: number, data: Partial<Member>) => api.put<Member>(`/members/${id}`, data),
  delete: (id: number) => api.delete(`/members/${id}`),
};

// ─── Loans ─────────────────────────────────────────────────────────────────

export const loansApi = {
  list: (params: { member_id?: number; book_id?: number; status?: string; page?: number; per_page?: number }) =>
    api.get<{ loans: Loan[]; total: number }>("/loans/", { params }),
  get:    (id: number) => api.get<Loan>(`/loans/${id}`),
  borrow: (book_id: number, member_id: number, loan_days = 14) =>
    api.post<Loan>("/loans/borrow", { book_id, member_id, loan_days }),
  return: (loanId: number) => api.post<Loan>(`/loans/return/${loanId}`),
};

// ─── Dashboard ─────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
};
