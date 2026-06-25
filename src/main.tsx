import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import App from '@/App';
import { getApiErrorMessage } from '@/lib/apiError';
import { TooltipProvider } from '@/components/ui';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Don't toast on 401 — those are handled by the Axios interceptors
      const status = (error as { response?: { status: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        toast.error(getApiErrorMessage(error), { duration: 4000 });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      const status = (error as { response?: { status: number } })?.response?.status;
      if (status !== 401 && status !== 403) {
        toast.error(getApiErrorMessage(error), { duration: 4000 });
      }
    },
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 20_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </TooltipProvider>
        <Toaster
          position="bottom-right"
          duration={4000}
          theme="dark"
          toastOptions={{
            className:
              '!bg-[var(--bg-card)] !border !border-[var(--border)] !text-[var(--text-primary)]',
          }}
        />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
