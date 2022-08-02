import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
    height: 100%;
  }

  html, body, #root {
    display: grid;
    grid-template: 'main' 1fr / 1fr;
    grid-area: main;
    overflow: hidden;
  }

  * {
    margin: 0;
    padding: 0;
  }
`;
