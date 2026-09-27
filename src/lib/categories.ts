import { api } from "../api/endpoints";
import type { Category } from "../api/types";
import { useAsync } from "./useAsync";

let cached: Promise<Category[]> | null = null;

export function useCategories() {
  return useAsync(() => {
    cached ??= api.categories().catch(error => {
      cached = null;

      throw error;
    });
    return cached;
  }, []);
}
