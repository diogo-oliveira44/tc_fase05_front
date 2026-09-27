import { useId, useState, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { api } from "../../api/endpoints";
import type { Incident, IncidentPriority, IncidentStatus } from "../../api/types";
import { useCurrentUser } from "../../auth/AuthContext";
import { priorities, priorityLabels, transitions } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { ErrorAlert, Field } from "../ui";

interface ActionProps {
  incident: Incident;
  onUpdated(incident: Incident): void;
  onConflict(): void;
}

export function ManagerActions(props: ActionProps) {
  return (
    <section className="card">
      <h2>Gestão</h2>
      <StatusActions {...props} />
      {/* Keyed so the form resets once the change is applied. */}
      <PriorityForm key={props.incident.priority} {...props} />
      <AssigneeForm key={props.incident.assigneeId ?? "none"} {...props} />
    </section>
  );
}

function useAction(onConflict: () => void) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>();

  async function run(action: () => Promise<void>) {
    setPending(true);
    setError(undefined);
    try {
      await action();
    } catch (err) {
      setError(err);
      if (err instanceof ApiError && err.code === "VERSION_CONFLICT") onConflict();
    } finally {
      setPending(false);
    }
  }

  return { pending, error, run };
}

function StatusActions({ incident, onUpdated, onConflict }: ActionProps) {
  const [target, setTarget] = useState<IncidentStatus | null>(null);
  const { pending, error, run } = useAction(onConflict);
  const options = transitions[incident.status];
  const selected = options.find(option => option.to === target);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "").trim() || undefined;

    void run(async () => {
      const updated = await api.transition(incident.id, {
        to: selected.to,
        observation: text("observation"),
        solution: text("solution"),
        version: incident.version,
      });
      setTarget(null);
      onUpdated(updated);
    });
  }

  return (
    <div className="action-group">
      <h3>Status</h3>
      {options.length === 0 ? (
        <p className="muted small">Estado final: não há novas mudanças de status.</p>
      ) : (
        <div className="button-row">
          {options.map(option => (
            <button
              key={option.to}
              type="button"
              className={`button ${option.to === "cancelled" ? "danger" : "secondary"}${option.to === target ? " selected" : ""}`}
              aria-pressed={option.to === target}
              onClick={() => setTarget(option.to === target ? null : option.to)}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <form key={selected.to} className="stack action-form" onSubmit={handleSubmit}>
          {selected.to === "resolved" && (
            <Field label="Solução aplicada">
              <textarea name="solution" rows={3} required />
            </Field>
          )}
          {selected.to === "cancelled" ? (
            <Field label="Motivo do cancelamento">
              <textarea name="observation" rows={2} required />
            </Field>
          ) : (
            <Field label="Observação" hint="Opcional">
              <textarea name="observation" rows={2} />
            </Field>
          )}
          <div className="button-row">
            <button className="button primary" disabled={pending}>
              {pending ? "Salvando…" : `Confirmar: ${selected.label}`}
            </button>
            <button type="button" className="button ghost" onClick={() => setTarget(null)}>
              Voltar
            </button>
          </div>
        </form>
      )}
      <ErrorAlert error={error} />
    </div>
  );
}

function PriorityForm({ incident, onUpdated, onConflict }: ActionProps) {
  const [priority, setPriority] = useState<IncidentPriority>(incident.priority);
  const [reason, setReason] = useState("");
  const { pending, error, run } = useAction(onConflict);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () =>
      onUpdated(await api.changePriority(incident.id, { priority, reason: reason.trim(), version: incident.version })),
    );
  }

  return (
    <form className="action-group stack" onSubmit={handleSubmit}>
      <h3>Prioridade</h3>
      <select aria-label="Prioridade" value={priority} onChange={event => setPriority(event.target.value as IncidentPriority)}>
        {priorities.map(value => (
          <option key={value} value={value}>
            {priorityLabels[value]}
          </option>
        ))}
      </select>
      {priority !== incident.priority && (
        <>
          <Field label="Justificativa">
            <input value={reason} onChange={event => setReason(event.target.value)} required />
          </Field>
          <div>
            <button className="button primary" disabled={pending}>
              {pending ? "Salvando…" : "Alterar prioridade"}
            </button>
          </div>
        </>
      )}
      <ErrorAlert error={error} />
    </form>
  );
}

function AssigneeForm({ incident, onUpdated, onConflict }: ActionProps) {
  const user = useCurrentUser();
  const inputId = useId();
  const managers = useAsync(() => api.managers(), []);
  const [assigneeId, setAssigneeId] = useState("");
  const [reason, setReason] = useState("");
  const { pending, error, run } = useAction(onConflict);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () =>
      onUpdated(
        await api.changeAssignee(incident.id, {
          assigneeId,
          reason: reason.trim(),
          version: incident.version,
        }),
      ),
    );
  }

  return (
    <form className="action-group stack" onSubmit={handleSubmit}>
      <h3>Responsável</h3>
      <p className="small">
        Atual: <strong>{incident.assigneeName ?? "não atribuído"}</strong>
      </p>
      <div className="field">
        <label className="field-label" htmlFor={inputId}>
          Gestor
        </label>
        <div className="input-with-button">
          <select
            id={inputId}
            value={assigneeId}
            onChange={event => setAssigneeId(event.target.value)}
            disabled={!managers.data}
            required
          >
            <option value="">{managers.data ? "Selecione…" : "Carregando…"}</option>
            {managers.data
              ?.filter(manager => manager.id !== incident.assigneeId)
              .map(manager => (
                <option key={manager.id} value={manager.id}>
                  {manager.id === user.id ? `${manager.name} (você)` : manager.name}
                </option>
              ))}
          </select>
          {incident.assigneeId !== user.id && (
            <button type="button" className="button secondary" onClick={() => setAssigneeId(user.id)}>
              Atribuir a mim
            </button>
          )}
        </div>
      </div>
      <ErrorAlert error={managers.error} />
      {assigneeId && (
        <>
          <Field label="Justificativa">
            <input value={reason} onChange={event => setReason(event.target.value)} required />
          </Field>
          <div>
            <button className="button primary" disabled={pending}>
              {pending ? "Salvando…" : "Atribuir"}
            </button>
          </div>
        </>
      )}
      <ErrorAlert error={error} />
    </form>
  );
}
