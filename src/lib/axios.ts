import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import type { ConsumerTokenResponse } from '@/types/models';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

// ─── Token refresh state ───────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function drainRefreshQueue(token: string | null, err: unknown = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    token ? resolve(token) : reject(err),
  );
  refreshQueue = [];
}

// ─── Consumer API (Bearer JWT + silent refresh) ────────────────────────────────

export const consumerApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

consumerApi.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

consumerApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

    if (!refreshToken) {
      clearAuth();
      window.location.href = '/app/login';
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue subsequent 401s until the single refresh resolves
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) => {
        original.headers = {
          ...original.headers,
          Authorization: `Bearer ${newToken}`,
        };
        return consumerApi(original);
      });
    }

    isRefreshing = true;

    try {
      const { data } = await axios.post<ConsumerTokenResponse>(
        `${BASE_URL}/api/v1/auth/refresh`,
        null,
        { params: { refresh_token: refreshToken } },
      );

      setTokens(data.access_token, data.refresh_token, data.expires_in);
      drainRefreshQueue(data.access_token);
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${data.access_token}`,
      };
      return consumerApi(original);
    } catch (refreshError) {
      drainRefreshQueue(null, refreshError);
      useAuthStore.getState().clearAuth();
      window.location.href = '/app/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ─── Admin API (Bearer Google ID token) ───────────────────────────────────────

export const adminApi: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const { googleIdToken } = useAdminAuthStore.getState();
  if (googleIdToken) {
    config.headers.Authorization = `Bearer ${googleIdToken}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error) => {
    const status = error.response?.status;
    // Google ID tokens expire after ~1h — redirect to login on 401
    if (status === 401) {
      useAdminAuthStore.getState().clearAdminAuth();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  },
);
