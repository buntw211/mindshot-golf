import { useQuery } from "@tanstack/react-query";

interface MembershipStatus {
  isPremium: boolean;
  journalCount: number;
  canCreateJournal: boolean;
  remainingFreeEntries: number;
  freeLimit: number;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
}

async function fetchMembership(): Promise<MembershipStatus | null> {
  const response = await fetch("/api/membership", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export function useMembership() {
  const { data: membership, isLoading, refetch } = useQuery<MembershipStatus | null>({
    queryKey: ["/api/membership"],
    queryFn: fetchMembership,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    membership,
    isLoading,
    refetch,
    isPremium: membership?.isPremium ?? false,
    canCreateJournal: membership?.canCreateJournal ?? true,
    remainingFreeEntries: membership?.remainingFreeEntries ?? 3,
    journalCount: membership?.journalCount ?? 0,
  };
}
