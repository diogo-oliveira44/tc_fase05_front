export type Role = "requester" | "manager";
export type IncidentStatus = "open" | "under_review" | "in_progress" | "resolved" | "cancelled";
export type IncidentPriority = "low" | "medium" | "high" | "critical";
export type IncidentSort = "createdAt" | "-createdAt" | "priority" | "-priority";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
}

export interface LoginResponse extends Tokens {
  user: User;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Incident {
  id: string;
  requesterId: string;
  requesterName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  address: string;
  locationDetails: string | null;
  latitude: number | null;
  longitude: number | null;
  status: IncidentStatus;
  priority: IncidentPriority;
  solution: string | null;
  resolvedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentInput {
  categoryId: string;
  title: string;
  description: string;
  address: string;
  locationDetails?: string;
  latitude?: number;
  longitude?: number;
}

export type IncidentFilters = {
  page?: number;
  pageSize?: number;
  status?: IncidentStatus;
  priority?: IncidentPriority;
  categoryId?: string;
  assigneeId?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: IncidentSort;
};

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface HistoryEntry {
  id: string;
  type: "status" | "assignment" | "priority";
  previousValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedByName: string;
  /** Assignee names, present only on entries of type "assignment". */
  previousLabel: string | null;
  newLabel: string | null;
  reason: string | null;
  createdAt: string;
}

export interface IncidentComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Attachment {
  id: string;
  incidentId: string;
  uploadedBy: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Rating {
  id: string;
  incidentId: string;
  authorId: string;
  authorName: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export interface TransitionInput {
  to: IncidentStatus;
  observation?: string;
  solution?: string;
  version: number;
}

export interface PriorityInput {
  priority: IncidentPriority;
  reason: string;
  version: number;
}

export interface AssigneeInput {
  assigneeId: string;
  reason: string;
  version: number;
}

export interface DashboardSummary {
  byStatus: { key: IncidentStatus; count: number }[];
  byCategory: { id: string; name: string; count: number }[];
  byPriority: { key: IncidentPriority; count: number }[];
  averageResolutionSeconds: number | null;
  overdue: number;
  slaHours: Record<IncidentPriority, number>;
  ratings: { average: number | null; distribution: Record<string, number> | null };
}
