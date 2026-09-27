import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { Brand, ErrorAlert, Field } from "../components/ui";
import { Link } from "../router";

export function RegisterPage() {
  const { register } = useAuth();
  const [error, setError] = useState<unknown>();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(undefined);
    setSubmitting(true);
    try {
      await register({
        name: String(form.get("name")).trim(),
        email: String(form.get("email")).trim(),
        password: String(form.get("password")),
      });
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
          <h1>Criar conta</h1>
          <p className="muted">Contas novas são de solicitante.</p>
        </div>
        <form className="stack" onSubmit={handleSubmit}>
          <Field label="Nome">
            <input name="name" autoComplete="name" required minLength={2} maxLength={150} autoFocus />
          </Field>
          <Field label="E-mail">
            <input name="email" type="email" autoComplete="email" required maxLength={320} />
          </Field>
          <Field label="Senha" hint="Mínimo de 8 caracteres">
            <input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={200} />
          </Field>
          <ErrorAlert error={error} />
          <button className="button primary" disabled={submitting}>
            {submitting ? "Criando conta…" : "Criar conta"}
          </button>
        </form>
        <p className="auth-switch">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
