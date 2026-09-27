import type { ReactNode } from "react";
import { useAuth, useCurrentUser } from "../auth/AuthContext";
import { roleLabels } from "../lib/format";
import { Link, useLocation } from "../router";
import { Brand } from "./ui";

export function Layout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const user = useCurrentUser();
  const { pathname } = useLocation();

  const links =
    user.role === "manager"
      ? [
          { to: "/", label: "Ocorrências" },
          { to: "/dashboard", label: "Painel" },
        ]
      : [
          { to: "/", label: "Minhas ocorrências" },
          { to: "/incidents/new", label: "Nova ocorrência" },
        ];

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" || (pathname.startsWith("/incidents/") && pathname !== "/incidents/new") : pathname === to;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="brand">
            <Brand />
          </Link>
          <nav className="nav">
            {links.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={isActive(link.to) ? "nav-link active" : "nav-link"}
                aria-current={isActive(link.to) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="user-menu">
            <span className="user-name">
              {user.name}
              <small>{roleLabels[user.role]}</small>
            </span>
            <button className="button ghost" onClick={() => void logout()}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
