import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

const API_BASE = "https://mindshotgolf.com";

async function fetchUser(): Promise<User | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(`${API_BASE}/api/auth/user`, {
      credentials: "include",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("fetchUser failed:", error);
    return null;
  }
}

async function logout(): Promise<void> {
  window.location.href = `${API_BASE}/api/logout`;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
