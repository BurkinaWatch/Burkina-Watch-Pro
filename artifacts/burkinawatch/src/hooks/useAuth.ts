import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always revalidate auth state
    gcTime: 0, // Don't cache auth state
  });

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user && !error,
  };
}
