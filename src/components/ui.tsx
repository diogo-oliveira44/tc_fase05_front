import type { ReactNode } from "react";
import type { IncidentPriority, IncidentStatus, PaginationMeta } from "../api/types";
import { errorMessage, priorityLabels, statusLabels } from "../lib/format";

export function StatusBadge({ status }: { status: IncidentStatus }) {
  return <span className={`badge status-${status}`}>{statusLabels[status]}</span>;
}

export function PriorityBadge({ priority }: { priority: IncidentPriority }) {
  return <span className={`badge priority-${priority}`}>{priorityLabels[priority]}</span>;
}

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;

  return (
    <p className="alert alert-error" role="alert">
      {errorMessage(error)}
    </p>
  );
}

export function Loading({ fullPage = false }: { fullPage?: boolean }) {
  return (
    <div className={fullPage ? "loading full-page" : "loading"} role="status">
      <span className="spinner" /> Carregando…
    </div>
  );
}

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={className ? `field ${className}` : "field"}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Brand() {
  return (
    <>
      <span className="brand-mark" aria-hidden="true">
        ✓
      </span>
      Resolve Aí
    </>
  );
}

export function Pagination({ meta, onPage }: { meta: PaginationMeta; onPage(page: number): void }) {
  if (meta.totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginação">
      <button className="button secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>
        Anterior
      </button>
      <span>
        Página {meta.page} de {meta.totalPages}
      </span>
      <button
        className="button secondary"
        disabled={meta.page >= meta.totalPages}
        onClick={() => onPage(meta.page + 1)}
      >
        Próxima
      </button>
    </nav>
  );
}
