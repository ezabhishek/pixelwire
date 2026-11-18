import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { createQueryClient } from '@/api/queryClient';
import { App } from '@/App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/styles/index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Pixel Wires: #root element is missing from index.html');

const queryClient = createQueryClient();

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
