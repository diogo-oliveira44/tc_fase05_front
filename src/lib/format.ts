import { ApiError } from "../api/client";
import type { IncidentPriority, IncidentStatus, Role } from "../api/types";

export const statusLabels: Record<IncidentStatus, string> = {
  open: "Aberta",
  under_review: "Em análise",
  in_progress: "Em atendimento",
  resolved: "Resolvida",
  cancelled: "Cancelada",
};

export const priorityLabels: Record<IncidentPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

export const roleLabels: Record<Role, string> = {
  requester: "Solicitante",
  manager: "Gestor",
};

export const statuses = Object.keys(statusLabels) as IncidentStatus[];
export const priorities = Object.keys(priorityLabels) as IncidentPriority[];

// Mirrors the state machine in tc_fase05/src/modules/incidents/domain.ts.
const cancel = { to: "cancelled", label: "Cancelar" } as const;
export const transitions: Record<IncidentStatus, { to: IncidentStatus; label: string }[]> = {
  open: [{ to: "under_review", label: "Analisar" }, cancel],
  under_review: [{ to: "in_progress", label: "Iniciar atendimento" }, cancel],
  in_progress: [{ to: "resolved", label: "Concluir" }, cancel],
  resolved: [],
  cancelled: [],
};

const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));

// <input type="date"> values are local dates; the API filters on UTC timestamps.
export const startOfDay = (date: string) => new Date(`${date}T00:00:00`).toISOString();
export const endOfDay = (date: string) => new Date(`${date}T23:59:59.999`).toISOString();

export function formatDuration(seconds: number) {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h ${minutes % 60} min`;
  return `${Math.floor(hours / 24)} d ${hours % 24} h`;
}

export const shortId = (id: string) => id.slice(0, 8);

const errorMessages: Record<string, string> = {
  API_UNREACHABLE: "Não foi possível conectar à API.",
  INTERNAL_ERROR: "A API encontrou um erro interno. Tente novamente mais tarde.",
  INVALID_CREDENTIALS: "E-mail ou senha inválidos.",
  EMAIL_ALREADY_EXISTS: "Este e-mail já está cadastrado.",
  INCIDENT_NOT_FOUND: "Ocorrência não encontrada.",
  INVALID_CATEGORY: "Categoria inválida ou inativa.",
  VERSION_CONFLICT: "A ocorrência foi alterada por outra pessoa. Os dados foram recarregados; tente novamente.",
  INVALID_STATUS_TRANSITION: "Essa mudança de status não é permitida.",
  OBSERVATION_REQUIRED: "Informe o motivo do cancelamento.",
  SOLUTION_REQUIRED: "Descreva a solução aplicada para concluir.",
  PRIORITY_UNCHANGED: "A prioridade escolhida é igual à atual.",
  ASSIGNEE_UNCHANGED: "Este gestor já é o responsável.",
  INVALID_ASSIGNEE: "O responsável precisa ser um gestor ativo.",
  ATTACHMENT_LIMIT_REACHED: "Limite de 5 imagens por ocorrência atingido.",
  UNSUPPORTED_MEDIA_TYPE: "Envie imagens JPEG, PNG ou WebP.",
  INVALID_IMAGE_CONTENT: "O conteúdo do arquivo não corresponde a uma imagem válida.",
  PAYLOAD_TOO_LARGE: "O arquivo excede o limite de 5 MB.",
  INCIDENT_NOT_RESOLVED: "Só é possível avaliar ocorrências resolvidas.",
  RATING_ALREADY_EXISTS: "Esta ocorrência já foi avaliada.",
  MANAGER_REQUIRED: "Acesso restrito a gestores.",
  REQUESTER_REQUIRED: "Apenas solicitantes podem registrar ocorrências.",
  INCIDENT_OWNER_REQUIRED: "Apenas o solicitante da ocorrência pode fazer isso.",
};

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return errorMessages[error.code] ?? error.message;
  if (error instanceof TypeError) return "Não foi possível conectar à API.";
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
}
