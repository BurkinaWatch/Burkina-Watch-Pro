import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { persistQueryClient, type PersistedClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 60 * 24, // 24 hours (for offline mode)
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days
      retry: (failureCount, error: any) => {
        // Retry only if it's a network error (potential connectivity issue)
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
          return failureCount < 3;
        }
        return false;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Configure offline persistence
if (typeof window !== "undefined") {
  const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "REACT_QUERY_OFFLINE_CACHE_V5",
    deserialize: (cacheString) => {
      const persisted = JSON.parse(cacheString) as PersistedClient & {
        clientState: PersistedClient["clientState"] & {
          queries?: Array<Record<string, unknown>>;
        };
      };
      // Pending-query promises are not safely serializable. Ignore them when
      // restoring so an old or interrupted cache cannot break hydration.
      if (Array.isArray(persisted.clientState?.queries)) {
        persisted.clientState.queries = persisted.clientState.queries.map(({ promise: _promise, ...query }) => query);
      }
      return persisted;
    },
  });

  const [, restorePromise] = persistQueryClient({
    queryClient,
    persister: localStoragePersister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    // The workspace port can encounter a persisted cache written by the
    // legacy dependency graph. Use a fresh buster so pending queries from that
    // cache cannot be hydrated into the new client.
    buster: "v5-safe-hydration",
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const key = query.queryKey.map(String).join("/");
        return ![
          "/api/auth",
          "/api/notifications",
          "/api/tracking",
          "/api/panic",
          "/api/emergency-contacts",
          "/api/push",
          "/api/surveillance",
          "/api/video",
          "/api/media",
        ].some((prefix) => key === prefix || key.startsWith(`${prefix}/`));
      },
    },
  });
  void restorePromise.catch((error) => {
    console.warn("[QueryCache] persisted cache discarded after restore failure", error);
  });
}
