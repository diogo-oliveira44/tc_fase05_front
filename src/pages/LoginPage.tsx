import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Brand, ErrorAlert, Field } from "../components/ui";
import { Link } from "../router";

export function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<unknown>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(undefined);
    setSubmitting(true);
    try {
      await login(String(form.get("email")), String(form.get("password")));
    } catch (err) {
      setError(err);
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <Brand />
        </div>
        <div>
          <h1>Entrar</h1>
          <p className="muted">Registre e acompanhe ocorrências.</p>
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <Field label="E-mail">
            <input name="email" type="email" autoComplete="email" required autoFocus />
          </Field>
          <Field label="Senha">
            <input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <ErrorAlert error={error} />
          <button className="button primary" disabled={submitting}>
            {submitting ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="auth-switch">
          Ainda não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      </div>
    </div>
  );
}
