import { useCallback, useEffect, useState, type DependencyList } from "react";

interface AsyncState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ data: undefined, error: undefined, loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setState(current => ({ ...current, error: undefined, loading: true }));

    load().then(
      data => active && setState({ data, error: undefined, loading: false }),
      error => active && setState(current => ({ ...current, error, loading: false })),
    );

    return () => {
      active = false;
    };
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt(count => count + 1), []);
  const setData = useCallback((data: T) => setState({ data, error: undefined, loading: false }), []);

  return { ...state, reload, setData };
}
