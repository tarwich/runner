import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { createGlobalStyle } from 'styled-components';
import { Application } from './application';
import { Providers } from './providers';

const GlobalStyle = createGlobalStyle`
  html {
    height: 100%;
  }

  html, body, #root {
    display: grid;
    grid-template: 'main' 1fr / 1fr;
    grid-area: main;
  }

  * {
    margin: 0;
    padding: 0;
  }
`;

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
