import { request, requestBlob } from "./client";
import type {
  AssigneeInput,
  Attachment,
  Category,
  CreateIncidentInput,
  DashboardSummary,
  HistoryEntry,
  Incident,
  IncidentComment,
  IncidentFilters,
  LoginResponse,
  Paginated,
  PriorityInput,
  Rating,
  RegisterInput,
  TransitionInput,
  User,
} from "./types";

const incidentPath = (id: string) => `/incidents/${encodeURIComponent(id)}`;

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", { method: "POST", body: { email, password } }),
  register: (input: RegisterInput) => request<User>("/auth/register", { method: "POST", body: input }),
  logout: (refreshToken: string) => request<void>("/auth/logout", { method: "POST", body: { refreshToken } }),
  me: () => request<User>("/me"),

  categories: () => request<{ data: Category[] }>("/categories").then(result => result.data),

  managers: () =>
    request<{ data: User[] }>("/users", { query: { role: "manager" } }).then(result => result.data),

  incidents: (filters: IncidentFilters) => request<Paginated<Incident>>("/incidents", { query: filters }),
  incident: (id: string) => request<Incident>(incidentPath(id)),
  createIncident: (input: CreateIncidentInput) => request<Incident>("/incidents", { method: "POST", body: input }),

  history: (id: string) =>
    request<{ data: HistoryEntry[] }>(`${incidentPath(id)}/history`).then(result => result.data),

  comments: (id: string) =>
    request<{ data: IncidentComment[] }>(`${incidentPath(id)}/comments`).then(result => result.data),
  addComment: (id: string, body: string) =>
    request<IncidentComment>(`${incidentPath(id)}/comments`, { method: "POST", body: { body } }),

  uploadAttachment: (id: string, file: File) =>
    request<Attachment>(`${incidentPath(id)}/attachments`, {
      method: "POST",
      body: file,
      headers: {
        "Content-Type": file.type,
        "X-File-Name": file.name.replace(/[^\x20-\x7e]/g, "_").slice(0, 255),
      },
    }),
  attachments: (id: string) =>
    request<{ data: Attachment[] }>(`${incidentPath(id)}/attachments`).then(result => result.data),
  attachment: (incidentId: string, attachmentId: string) =>
    requestBlob(`${incidentPath(incidentId)}/attachments/${encodeURIComponent(attachmentId)}`),

  rating: (id: string) => request<Rating>(`${incidentPath(id)}/rating`),
  rate: (id: string, input: { score: number; comment?: string }) =>
    request<Rating>(`${incidentPath(id)}/rating`, { method: "POST", body: input }),

  changePriority: (id: string, input: PriorityInput) =>
    request<Incident>(`${incidentPath(id)}/priority`, { method: "PATCH", body: input }),
  changeAssignee: (id: string, input: AssigneeInput) =>
    request<Incident>(`${incidentPath(id)}/assignee`, { method: "PATCH", body: input }),
  transition: (id: string, input: TransitionInput) =>
    request<Incident>(`${incidentPath(id)}/transitions`, { method: "POST", body: input }),

  dashboard: (range: { createdFrom?: string; createdTo?: string }) =>
    request<DashboardSummary>("/dashboard/summary", { query: range }),
};
