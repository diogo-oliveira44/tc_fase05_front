import { useState, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { api } from "../../api/endpoints";
import type { Rating } from "../../api/types";
import { useAsync } from "../../lib/useAsync";
import { ErrorAlert, Loading } from "../ui";

export function RatingForm({ incidentId }: { incidentId: string }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<unknown>();
  const [sending, setSending] = useState(false);
  // A missing rating is the normal case, not a failure.
  const existing = useAsync<Rating | null>(
    () =>
      api.rating(incidentId).catch(err => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
    [incidentId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSending(true);
    try {
      existing.setData(await api.rate(incidentId, { score, comment: comment.trim() || undefined }));
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  if (!existing.data && existing.loading) {
    return (
      <section className="card">
        <h2>Avaliação</h2>
        <Loading />
      </section>
    );
  }

  const rating = existing.data;
  if (rating) {
    return (
      <section className="card">
        <h2>Avaliação</h2>
        <p className="stars" aria-label={`Nota ${rating.score} de 5`}>
          {"★".repeat(rating.score)}
          <span className="stars-empty">{"★".repeat(5 - rating.score)}</span>
        </p>
        {rating.comment && <p className="prose">“{rating.comment}”</p>}
        <p className="muted small">Obrigado pelo retorno!</p>
      </section>
    );
  }

  return (
    <form className="card stack" onSubmit={handleSubmit}>
      <h2>Avalie o atendimento</h2>
      <div className="star-input" role="radiogroup" aria-label="Nota">
        {[1, 2, 3, 4, 5].map(value => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={score === value}
            aria-label={`${value} de 5`}
            className={value <= score ? "star active" : "star"}
            onClick={() => setScore(value)}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        aria-label="Comentário da avaliação"
        placeholder="Comentário (opcional)"
        rows={2}
        value={comment}
        onChange={event => setComment(event.target.value)}
      />
      <ErrorAlert error={existing.error} />
      <ErrorAlert error={error} />
      <div>
        <button className="button primary" disabled={sending || score === 0}>
          {sending ? "Enviando…" : "Enviar avaliação"}
        </button>
      </div>
    </form>
  );
}
