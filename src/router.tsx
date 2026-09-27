import { useEffect, useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from "react";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("popstate", listener);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("popstate", listener);
  };
}

const currentPath = () => window.location.pathname + window.location.search;

export function navigate(to: string, { replace = false } = {}) {
  if (to === currentPath()) return;

  window.history[replace ? "replaceState" : "pushState"](null, "", to);
  listeners.forEach(listener => listener());

  if (!replace) window.scrollTo(0, 0);
}

export function useLocation() {
  const path = useSyncExternalStore(subscribe, currentPath);
  const url = new URL(path, window.location.origin);

  return { pathname: url.pathname, search: url.search, query: url.searchParams };
}

export function Link({ to, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();

    navigate(to);
  }

  return <a {...props} href={to} onClick={handleClick} />;
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => navigate(to, { replace: true }), [to]);

  return null;
}
