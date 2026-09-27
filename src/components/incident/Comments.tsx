import { useState, type FormEvent } from "react";
import { api } from "../../api/endpoints";
import { useCurrentUser } from "../../auth/AuthContext";
import { formatDateTime } from "../../lib/format";
import { useAsync } from "../../lib/useAsync";
import { ErrorAlert, Loading } from "../ui";

export function Comments({ incidentId }: { incidentId: string }) {
  const user = useCurrentUser();
  const comments = useAsync(() => api.comments(incidentId), [incidentId]);
  const [body, setBody] = useState("");
  const [error, setError] = useState<unknown>();
  const [sending, setSending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setSending(true);
    try {
      await api.addComment(incidentId, body.trim());
      setBody("");
      comments.reload();
    } catch (err) {
      setError(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="card">
      <h2>
        Comentários {comments.data && <span className="count">{comments.data.length}</span>}
      </h2>
      <ErrorAlert error={comments.error} />
      {!comments.data && comments.loading && <Loading />}
      {comments.data?.length === 0 && <p className="muted small">Nenhum comentário ainda.</p>}

      {comments.data && comments.data.length > 0 && (
        <ul className="comments">
          {comments.data.map(comment => {
            const own = comment.authorId === user.id;
            return (
              <li key={comment.id} className={own ? "comment own" : "comment"}>
                <div className="comment-head">
                  <strong>{own ? "Você" : comment.authorName}</strong>
                  <time dateTime={comment.createdAt}>{formatDateTime(comment.createdAt)}</time>
                </div>
                <p className="prose">{comment.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      <form className="stack comment-form" onSubmit={handleSubmit}>
        <textarea
          aria-label="Novo comentário"
          placeholder="Escreva um comentário…"
          rows={3}
          value={body}
          onChange={event => setBody(event.target.value)}
          required
        />
        <ErrorAlert error={error} />
        <div className="form-actions">
          <button className="button primary" disabled={sending || !body.trim()}>
            {sending ? "Enviando…" : "Comentar"}
          </button>
        </div>
      </form>
    </section>
  );
}
