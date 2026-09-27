import type { Role } from "./api/types";
import { useAuth } from "./auth/AuthContext";
import { Layout } from "./components/Layout";
import { Loading } from "./components/ui";
import { DashboardPage } from "./pages/DashboardPage";
import { IncidentDetailPage } from "./pages/IncidentDetailPage";
import { IncidentListPage } from "./pages/IncidentListPage";
import { LoginPage } from "./pages/LoginPage";
import { NewIncidentPage } from "./pages/NewIncidentPage";
import { RegisterPage } from "./pages/RegisterPage";
import { Link, Redirect, useLocation } from "./router";
import "./index.css";

export function App() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) return <Loading fullPage />;

  if (!user) return pathname === "/register" ? <RegisterPage /> : <LoginPage />;

  if (pathname === "/login" || pathname === "/register") return <Redirect to="/" />;

  return <Layout>{renderPage(pathname, user.role)}</Layout>;
}

function renderPage(pathname: string, role: Role) {
  if (pathname === "/") return <IncidentListPage />;
  if (pathname === "/incidents/new") return role === "requester" ? <NewIncidentPage /> : <NotFoundPage />;
  if (pathname === "/dashboard") return role === "manager" ? <DashboardPage /> : <NotFoundPage />;

  const incidentId = pathname.match(/^\/incidents\/([^/]+)$/)?.[1];
  if (incidentId) return <IncidentDetailPage key={incidentId} id={incidentId} />;

  return <NotFoundPage />;
}

function NotFoundPage() {
  return (
    <div className="empty">
      <h1>Página não encontrada</h1>
      <Link to="/" className="button primary">
        Voltar ao início
      </Link>
    </div>
  );
}

export default App;
