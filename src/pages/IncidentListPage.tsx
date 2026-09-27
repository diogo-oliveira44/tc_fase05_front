import { api } from "../api/endpoints";
import type { IncidentPriority, IncidentSort, IncidentStatus } from "../api/types";
import { useCurrentUser } from "../auth/AuthContext";
import { ErrorAlert, Field, Loading, Pagination, PriorityBadge, StatusBadge } from "../components/ui";
import { useCategories } from "../lib/categories";
import {
  endOfDay,
  formatDateTime,
  priorities,
  priorityLabels,
  startOfDay,
  statuses,
  statusLabels,
} from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { Link, navigate, useLocation } from "../router";

const PAGE_SIZE = 10;
const FILTER_KEYS = ["status", "priority", "categoryId", "from", "to", "sort", "mine"];

export function IncidentListPage() {
  const user = useCurrentUser();
  const isManager = user.role === "manager";
  const { search, query } = useLocation();
  const categories = useCategories();

  const page = Number(query.get("page")) || 1;
  const from = query.get("from") ?? "";
  const to = query.get("to") ?? "";
  const mine = isManager && query.get("mine") === "1";
  const hasFilters = FILTER_KEYS.some(key => query.has(key));

  const incidents = useAsync(
    async () =>
      api.incidents({
        page,
        pageSize: PAGE_SIZE,
        status: (query.get("status") || undefined) as IncidentStatus | undefined,
        priority: (query.get("priority") || undefined) as IncidentPriority | undefined,
        categoryId: query.get("categoryId") || undefined,
        assigneeId: mine ? user.id : undefined,
        createdFrom: from ? startOfDay(from) : undefined,
        createdTo: to ? endOfDay(to) : undefined,
        sort: (query.get("sort") || undefined) as IncidentSort | undefined,
      }),
    [search],
  );

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    const paging = "page" in changes;
    if (!paging) next.delete("page");
    const nextSearch = next.toString();
    navigate(nextSearch ? `/?${nextSearch}` : "/", { replace: !paging });
  }

  const result = incidents.data;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{isManager ? "Ocorrências" : "Minhas ocorrências"}</h1>
          {result && (
            <p className="muted">
              {result.meta.total} {result.meta.total === 1 ? "ocorrência" : "ocorrências"}
            </p>
          )}
        </div>
        {!isManager && (
          <Link to="/incidents/new" className="button primary">
            Nova ocorrência
          </Link>
        )}
      </div>

      <div className="filters">
        <Field label="Status">
          <select value={query.get("status") ?? ""} onChange={event => update({ status: event.target.value })}>
            <option value="">Todos</option>
            {statuses.map(status => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Prioridade">
          <select value={query.get("priority") ?? ""} onChange={event => update({ priority: event.target.value })}>
            <option value="">Todas</option>
            {priorities.map(priority => (
              <option key={priority} value={priority}>
                {priorityLabels[priority]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Categoria">
          <select value={query.get("categoryId") ?? ""} onChange={event => update({ categoryId: event.target.value })}>
            <option value="">Todas</option>
            {categories.data?.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="De">
          <input type="date" value={from} max={to || undefined} onChange={event => update({ from: event.target.value })} />
        </Field>
        <Field label="Até">
          <input type="date" value={to} min={from || undefined} onChange={event => update({ to: event.target.value })} />
        </Field>
        <Field label="Ordenar por">
          <select
            value={query.get("sort") ?? "-createdAt"}
            onChange={event => update({ sort: event.target.value === "-createdAt" ? null : event.target.value })}
          >
            <option value="-createdAt">Mais recentes</option>
            <option value="createdAt">Mais antigas</option>
            <option value="-priority">Maior prioridade</option>
            <option value="priority">Menor prioridade</option>
          </select>
        </Field>
        {isManager && (
          <label className="checkbox">
            <input type="checkbox" checked={mine} onChange={event => update({ mine: event.target.checked ? "1" : null })} />
            Atribuídas a mim
          </label>
        )}
        {hasFilters && (
          <button className="button ghost" onClick={() => navigate("/", { replace: true })}>
            Limpar filtros
          </button>
        )}
      </div>

      <ErrorAlert error={incidents.error} />
      {!result && incidents.loading && <Loading />}

      {result && result.data.length === 0 && (
        <div className="empty card">
          {hasFilters ? (
            <p>Nenhuma ocorrência encontrada com esses filtros.</p>
          ) : isManager ? (
            <p>Nenhuma ocorrência registrada ainda.</p>
          ) : (
            <>
              <p>Você ainda não registrou nenhuma ocorrência.</p>
              <Link to="/incidents/new" className="button primary">
                Registrar a primeira
              </Link>
            </>
          )}
        </div>
      )}

      {result && result.data.length > 0 && (
        <>
          <div className={incidents.loading ? "table-wrap is-loading" : "table-wrap"}>
            <table className="table">
              <thead>
                <tr>
                  <th>Ocorrência</th>
                  <th>Categoria</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  {isManager && <th>Responsável</th>}
                  <th>Registrada em</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map(incident => (
                  <tr key={incident.id} onClick={() => navigate(`/incidents/${incident.id}`)}>
                    <td>
                      <Link to={`/incidents/${incident.id}`} className="row-title">
                        {incident.title}
                      </Link>
                      <span className="row-sub">{incident.address}</span>
                    </td>
                    <td>{incident.categoryName}</td>
                    <td>
                      <StatusBadge status={incident.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={incident.priority} />
                    </td>
                    {isManager && (
                      <td className="nowrap">
                        {incident.assigneeName ?? "—"}
                      </td>
                    )}
                    <td className="nowrap">{formatDateTime(incident.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={result.meta} onPage={next => update({ page: String(next) })} />
        </>
      )}
    </>
  );
}
