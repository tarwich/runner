import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { Application } from './application';
import { GlobalStyle } from './global-style';
import { Providers } from './providers';

export const Bootstrap = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <Providers providers={[<QueryClientProvider client={queryClient} />]}>
      <GlobalStyle />
      <Application />
    </Providers>
  );
};
