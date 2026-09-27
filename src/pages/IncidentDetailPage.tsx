import { api } from "../api/endpoints";
import type { Incident } from "../api/types";
import { useCurrentUser } from "../auth/AuthContext";
import { Attachments } from "../components/incident/Attachments";
import { Comments } from "../components/incident/Comments";
import { History } from "../components/incident/History";
import { ManagerActions } from "../components/incident/ManagerActions";
import { RatingForm } from "../components/incident/RatingForm";
import { ErrorAlert, Loading, PriorityBadge, StatusBadge } from "../components/ui";
import { formatDateTime, shortId } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import { Link } from "../router";

export function IncidentDetailPage({ id }: { id: string }) {
  const user = useCurrentUser();
  const incident = useAsync(() => api.incident(id), [id]);
  const history = useAsync(() => api.history(id), [id]);

  const isManager = user.role === "manager";
  const backLink = (
    <Link to="/" className="back-link">
      ← {isManager ? "Ocorrências" : "Minhas ocorrências"}
    </Link>
  );

  if (!incident.data) {
    if (!incident.error) return <Loading />;
    return (
      <>
        {backLink}
        <ErrorAlert error={incident.error} />
      </>
    );
  }

  const data = incident.data;
  const isOwner = data.requesterId === user.id;

  function handleUpdated(updated: Incident) {
    incident.setData(updated);
    history.reload();
  }

  return (
    <>
      <div className="page-header">
        <div>
          {backLink}
          <h1>{data.title}</h1>
          <div className="meta-row">
            <StatusBadge status={data.status} />
            <PriorityBadge priority={data.priority} />
            <span className="muted small">
              {data.categoryName} · #{shortId(data.id)}
            </span>
          </div>
        </div>
        <button
          className="button secondary"
          disabled={incident.loading}
          onClick={() => {
            incident.reload();
            history.reload();
          }}
        >
          Atualizar
        </button>
      </div>

      <ErrorAlert error={incident.error} />

      <div className="detail-grid">
        <div className="stack">
          <section className="card">
            <h2>Descrição</h2>
            <p className="prose">{data.description}</p>
            <dl className="details">
              <div>
                <dt>Endereço</dt>
                <dd>{data.address}</dd>
              </div>
              {data.locationDetails && (
                <div>
                  <dt>Complemento</dt>
                  <dd>{data.locationDetails}</dd>
                </div>
              )}
              {data.latitude != null && data.longitude != null && (
                <div>
                  <dt>Coordenadas</dt>
                  <dd>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${data.latitude}&mlon=${data.longitude}#map=18/${data.latitude}/${data.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {data.latitude}, {data.longitude} ↗
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {data.solution && (
            <section className="card solution">
              <h2>Solução aplicada</h2>
              <p className="prose">{data.solution}</p>
              {data.resolvedAt && <p className="muted small">Resolvida em {formatDateTime(data.resolvedAt)}</p>}
            </section>
          )}

          <Attachments incidentId={data.id} canUpload={isOwner} />
          <Comments incidentId={data.id} />
        </div>

        <aside className="stack">
          <section className="card">
            <h2>Resumo</h2>
            <dl className="details compact">
              <div>
                <dt>Responsável</dt>
                <dd>{data.assigneeName ?? "Não atribuído"}</dd>
              </div>
              <div>
                <dt>Solicitante</dt>
                <dd>{data.requesterName}</dd>
              </div>
              <div>
                <dt>Registrada em</dt>
                <dd>{formatDateTime(data.createdAt)}</dd>
              </div>
              <div>
                <dt>Atualizada em</dt>
                <dd>{formatDateTime(data.updatedAt)}</dd>
              </div>
            </dl>
          </section>

          {isManager && <ManagerActions incident={data} onUpdated={handleUpdated} onConflict={incident.reload} />}
          {isOwner && data.status === "resolved" && <RatingForm incidentId={data.id} />}

          <History entries={history.data} error={history.error} />
        </aside>
      </div>
    </>
  );
}
