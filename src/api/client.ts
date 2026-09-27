import type { Tokens } from "./types";

const BASE_URL = "/api/v1";
const STORAGE_KEY = "resolveai.session";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown[];

  constructor(status: number, code: string, message: string, details: unknown[] = []) {
    super(message);

    this.status = status;
    this.code = code;
    this.details = details;
  }
}

type Session = Pick<Tokens, "accessToken" | "refreshToken">;

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: object;
  headers?: Record<string, string>;
}

let session: Session | null = loadSession();
let refreshing: Promise<boolean> | null = null;
const listeners = new Set<() => void>();

function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function getSession() {
  return session;
}

export function setSession(next: Session | null) {
  session = next;
  try {
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
  }

  listeners.forEach(listener => listener());
}

export function onSessionChange(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = session?.refreshToken;

    if (!refreshToken) return false;

    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.status === 401) setSession(null);
    if (!response.ok) return false;

    const tokens = (await response.json()) as Tokens;
    setSession({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken });
    return true;
  })().finally(() => {
    refreshing = null;
  });

  return refreshing;
}

async function send(path: string, options: RequestOptions, retried = false): Promise<Response> {
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.body instanceof Blob) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const token = session?.accessToken;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(BASE_URL + withQuery(path, options.query), {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (response.status === 401 && token && !retried) {
    const renewed = session !== null && (session.accessToken !== token || (await refreshSession()));

    if (renewed) return send(path, options, true);
  }

  if (!response.ok) throw await toApiError(response);

  return response;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

export async function requestBlob(path: string): Promise<Blob> {
  const response = await send(path, {});

  return response.blob();
}

function withQuery(path: string, query?: object) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const search = params.toString();

  return search ? `${path}?${search}` : path;
}

async function toApiError(response: Response) {
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: unknown[] };
  } | null;
  const error = payload?.error;

  return new ApiError(
    response.status,
    error?.code ?? "HTTP_ERROR",
    error?.message ?? `A requisição falhou (HTTP ${response.status}).`,
    error?.details ?? [],
  );
}
