/**
 * Legacy fetch-based client for OTA admin endpoints.
 * Updated to use Google ID token as Bearer authentication (instead of API key).
 *
 * Note: New consumer and admin API calls use the Axios instances in lib/axios.ts.
 * This client is kept for backward-compat with existing OTA hooks.
 */
import { ApiError } from '@/lib/apiError';
import { useAdminAuthStore } from '@/stores/adminAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler;
}

interface RequestOptions extends RequestInit {
  auth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (
    !requestHeaders.has('Content-Type') &&
    !(rest.body instanceof FormData) &&
    rest.method &&
    rest.method !== 'GET'
  ) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const { googleIdToken } = useAdminAuthStore.getState();
    if (!googleIdToken) {
      throw new ApiError(401, 'Not authenticated. Please sign in with Google.');
    }
    requestHeaders.set('Authorization', `Bearer ${googleIdToken}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach server');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload !== null
        ? (payload.detail as string | undefined) || (payload.message as string | undefined)
        : undefined;

    if (response.status === 401) {
      useAdminAuthStore.getState().clearAdminAuth();
      unauthorizedHandler?.();
    }

    throw new ApiError(response.status, detail || response.statusText, detail);
  }

  return payload as T;
}
