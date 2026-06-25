import { consumerApi } from '@/lib/axios';
import type { ConsumerTokenResponse, GoogleAuthRequest, UserResponse } from '@/types/models';

/**
 * POST /api/v1/auth/google
 * Exchange a Google ID token (from @react-oauth/google) for a Hellum JWT pair.
 */
export async function googleSignIn(idToken: string): Promise<ConsumerTokenResponse> {
  const body: GoogleAuthRequest = { id_token: idToken };
  const { data } = await consumerApi.post<ConsumerTokenResponse>('/api/v1/auth/google', body);
  return data;
}

/**
 * GET /api/v1/me
 * Returns the authenticated consumer's profile.
 */
export async function getMe(): Promise<UserResponse> {
  const { data } = await consumerApi.get<UserResponse>('/api/v1/me');
  return data;
}
