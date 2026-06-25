import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { googleSignIn, getMe } from '@/api/consumer/auth';
import { useAuthStore } from '@/stores/authStore';
import { queryKeys } from '@/hooks/queryKeys';

/**
 * Returns the current authenticated user's profile.
 * Only queries when the user is authenticated.
 */
export function useMe() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: getMe,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Mutation: exchange Google ID token for Hellum JWT pair.
 * On success: stores tokens + fetches and stores user profile.
 */
export function useGoogleSignIn() {
  const { setTokens, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (idToken: string) => {
      const tokens = await googleSignIn(idToken);
      setTokens(tokens.access_token, tokens.refresh_token, tokens.expires_in);
      // Immediately fetch user profile
      const user = await getMe();
      setUser(user);
      return user;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Sign-in failed. Please try again.');
    },
  });
}

/**
 * Returns a sign-out function that clears auth state and React Query cache.
 */
export function useSignOut() {
  const { clearAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return () => {
    clearAuth();
    queryClient.clear();
    window.location.href = '/app/login';
  };
}
