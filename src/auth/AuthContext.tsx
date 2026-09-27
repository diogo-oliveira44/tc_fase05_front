import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, getSession, onSessionChange, setSession } from "../api/client";
import { api } from "../api/endpoints";
import type { RegisterInput, User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: RegisterInput): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => getSession() !== null);

  useEffect(() => {
    const unsubscribe = onSessionChange(() => {
      if (!getSession()) setUser(null);
    });

    if (getSession()) {
      api
        .me()
        .then(setUser)
        .catch(error => {
          if (error instanceof ApiError && error.status === 401) setSession(null);
        })
        .finally(() => setLoading(false));
    }

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    const result = await api.login(email, password);
    setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    setUser(result.user);
  }

  async function register(input: RegisterInput) {
    await api.register(input);
    await login(input.email, input.password);
  }

  async function logout() {
    const current = getSession();
    if (current) await api.logout(current.refreshToken).catch(() => { });
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function useCurrentUser() {
  const { user } = useAuth();
  if (!user) throw new Error("useCurrentUser requires an authenticated user");
  return user;
}
