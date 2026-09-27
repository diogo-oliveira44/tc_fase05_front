import { useState, type CSSProperties } from "react";
import { api } from "../api/endpoints";
import type { DashboardSummary, IncidentStatus } from "../api/types";
import { ErrorAlert, Field, Loading } from "../components/ui";
import {
  endOfDay,
  formatDuration,
  priorities,
  priorityLabels,
  startOfDay,
  statuses,
  statusLabels,
} from "../lib/format";
import { useAsync } from "../lib/useAsync";

const PRESETS = [7, 30, 90];
const ACTIVE_STATUSES: IncidentStatus[] = ["open", "under_review", "in_progress"];

const numberFormat = new Intl.NumberFormat("pt-BR");
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
const decimalFormat = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Local calendar date as YYYY-MM-DD, the format of <input type="date">.
function toDateInput(date: Date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return toDateInput(date);
}

export function DashboardPage() {
  const [range, setRange] = useState({ from: "", to: "" });
  const today = toDateInput(new Date());

  const summary = useAsync(
    async () =>
      api.dashboard({
        createdFrom: range.from ? startOfDay(range.from) : undefined,
        createdTo: range.to ? endOfDay(range.to) : undefined,
      }),
    [range.from, range.to],
  );

  const isAllTime = !range.from && !range.to;
  const activePreset = range.to === today ? PRESETS.find(days => range.from === daysAgo(days)) : undefined;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Painel</h1>
          <p className="muted">Indicadores das ocorrências registradas no período.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Período">
          <button type="button" aria-pressed={isAllTime} onClick={() => setRange({ from: "", to: "" })}>
            Todo o período
          </button>
          {PRESETS.map(days => (
            <button
              key={days}
              type="button"
              aria-pressed={activePreset === days}
              onClick={() => setRange({ from: daysAgo(days), to: today })}
            >
              {days} dias
            </button>
          ))}
        </div>
        <Field label="De">
          <input
            type="date"
            value={range.from}
            max={range.to || undefined}
            onChange={event => setRange({ ...range, from: event.target.value })}
          />
        </Field>
        <Field label="Até">
          <input
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={event => setRange({ ...range, to: event.target.value })}
          />
        </Field>
      </div>

      <ErrorAlert error={summary.error} />
      {!summary.data && summary.loading && <Loading />}
      {summary.data && (
        // Keep the previous render, dimmed, while a new period loads.
        <div className={summary.loading ? "dashboard is-loading" : "dashboard"}>
          <SummaryView data={summary.data} />
        </div>
      )}
    </>
  );
}

function SummaryView({ data }: { data: DashboardSummary }) {
  const statusCount = (status: IncidentStatus) => data.byStatus.find(row => row.key === status)?.count ?? 0;
  const total = data.byStatus.reduce((sum, row) => sum + row.count, 0);
  const active = ACTIVE_STATUSES.reduce((sum, status) => sum + statusCount(status), 0);
  const resolved = statusCount("resolved");
  const distribution = data.ratings.distribution ?? {};
  const ratingCount = Object.values(distribution).reduce((sum, count) => sum + count, 0);

  return (
    <>
      <div className="kpis">
        <StatTile label="Ocorrências" value={numberFormat.format(total)} />
        <StatTile label="Em andamento" value={numberFormat.format(active)} note="Abertas, em análise ou em atendimento" />
        <StatTile
          label="Resolvidas"
          value={numberFormat.format(resolved)}
          note={total > 0 ? `${percentFormat.format(resolved / total)} do total` : undefined}
        />
        <StatTile
          label="Em atraso"
          value={numberFormat.format(data.overdue)}
          note={`SLA: ${data.slaHours.critical}h crítica · ${data.slaHours.high}h alta · ${data.slaHours.medium}h média · ${data.slaHours.low}h baixa`}
        />
        <StatTile
          label="Tempo médio de resolução"
          value={data.averageResolutionSeconds == null ? "—" : formatDuration(data.averageResolutionSeconds)}
        />
        <StatTile
          label="Avaliação média"
          value={data.ratings.average == null ? "—" : `${decimalFormat.format(data.ratings.average)} / 5`}
          note={`${numberFormat.format(ratingCount)} ${ratingCount === 1 ? "avaliação" : "avaliações"}`}
        />
      </div>

      <div className="charts">
        <BarChart
          title="Por status"
          dimension="Status"
          unit={["ocorrência", "ocorrências"]}
          rows={statuses.map(status => ({ label: statusLabels[status], value: statusCount(status) }))}
        />
        <BarChart
          title="Por prioridade"
          dimension="Prioridade"
          unit={["ocorrência", "ocorrências"]}
          rows={priorities.map(priority => ({
            label: priorityLabels[priority],
            value: data.byPriority.find(row => row.key === priority)?.count ?? 0,
          }))}
        />
        <BarChart
          title="Por categoria"
          dimension="Categoria"
          unit={["ocorrência", "ocorrências"]}
          rows={[...data.byCategory]
            .sort((a, b) => b.count - a.count)
            .map(category => ({ label: category.name, value: category.count }))}
        />
        <BarChart
          title="Notas das avaliações"
          // The API computes ratings over all incidents, ignoring the date filter.
          caption="Considera todas as avaliações, independentemente do período."
          dimension="Nota"
          unit={["avaliação", "avaliações"]}
          rows={[5, 4, 3, 2, 1].map(score => ({ label: `${score} de 5`, value: distribution[String(score)] ?? 0 }))}
        />
      </div>
    </>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat-tile">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {note && <span className="stat-note">{note}</span>}
    </div>
  );
}

interface BarRow {
  label: string;
  value: number;
}

function BarChart({
  title,
  caption,
  dimension,
  unit,
  rows,
}: {
  title: string;
  caption?: string;
  dimension: string;
  unit: [singular: string, plural: string];
  rows: BarRow[];
}) {
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(0, ...rows.map(row => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const share = (row: BarRow) => (total > 0 ? percentFormat.format(row.value / total) : "—");
  const amount = (row: BarRow) => `${numberFormat.format(row.value)} ${row.value === 1 ? unit[0] : unit[1]}`;

  return (
    <figure className="card chart">
      <div className="chart-header">
        <figcaption>
          <h2>{title}</h2>
          {caption && <p className="muted small">{caption}</p>}
        </figcaption>
        <button type="button" className="button ghost compact" aria-pressed={showTable} onClick={() => setShowTable(!showTable)}>
          {showTable ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="muted small">Sem dados no período.</p>
      ) : showTable ? (
        <table className="table data-table">
          <thead>
            <tr>
              <th>{dimension}</th>
              <th className="numeric">Quantidade</th>
              <th className="numeric">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td className="numeric">{numberFormat.format(row.value)}</td>
                <td className="numeric">{share(row)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="bars">
          {rows.map(row => (
            <li key={row.label} className="bar-row" tabIndex={0} aria-label={`${row.label}: ${amount(row)} (${share(row)})`}>
              <span className="bar-label">{row.label}</span>
              <span className="bar-track">
                <span
                  className="bar"
                  style={{ "--ratio": max > 0 && row.value > 0 ? Math.max(row.value / max, 0.01) : 0 } as CSSProperties}
                />
                <span className="bar-value">{numberFormat.format(row.value)}</span>
              </span>
              <span className="bar-tooltip" aria-hidden="true">
                <strong>
                  <i className="line-key" />
                  {amount(row)} · {share(row)}
                </strong>
                <span>{row.label}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
