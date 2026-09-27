import type { HistoryEntry, IncidentPriority, IncidentStatus } from "../../api/types";
import { formatDateTime, priorityLabels, statusLabels } from "../../lib/format";
import { ErrorAlert, Loading } from "../ui";

const CREATION_OBSERVATION = "Occurrence created";

export function History({ entries, error }: { entries: HistoryEntry[] | undefined; error: unknown }) {
  return (
    <section className="card">
      <h2>Histórico</h2>
      <ErrorAlert error={error} />
      {!entries && !error && <Loading />}
      {entries && (
        <ol className="timeline">
          {entries.map(entry => (
            <li key={entry.id} className={`timeline-item type-${entry.type}`}>
              <p className="timeline-title">{describe(entry)}</p>
              {entry.reason && entry.reason !== CREATION_OBSERVATION && (
                <p className="timeline-reason">“{entry.reason}”</p>
              )}
              <p className="timeline-meta">
                {entry.changedByName} · {formatDateTime(entry.createdAt)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function describe(entry: HistoryEntry) {
  const { previousValue, newValue } = entry;

  switch (entry.type) {
    case "status":
      if (!previousValue) return "Ocorrência registrada";

      return `Status: ${statusLabels[previousValue as IncidentStatus]} → ${statusLabels[newValue as IncidentStatus]}`;
    case "priority":
      return `Prioridade: ${priorityLabels[previousValue as IncidentPriority]} → ${priorityLabels[newValue as IncidentPriority]}`;
    case "assignment": {
      const next = entry.newLabel ?? "—";
      if (!previousValue) return `Atribuída a ${next}`;

      return `Responsável: ${entry.previousLabel ?? "—"} → ${next}`;
    }
  }
}
