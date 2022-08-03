import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  html {
    height: 100%;
    font-family: 'Lato', sans-serif;

    --color-blue-100: hsl(208, 100%, 10%);
    --color-blue-200: hsl(208, 100%, 20%);
    --color-blue-300: hsl(208, 100%, 30%);
    --color-blue-400: hsl(208, 100%, 40%);
    --color-blue-500: hsl(208, 100%, 50%);
    --color-blue-600: hsl(208, 100%, 60%);
    --color-blue-700: hsl(208, 100%, 70%);
    --color-blue-800: hsl(208, 100%, 80%);
    --color-blue-900: hsl(208, 100%, 90%);

    --color-green-100: hsl(145, 100%, 10%);
    --color-green-200: hsl(145, 100%, 20%);
    --color-green-300: hsl(145, 100%, 30%);
    --color-green-400: hsl(145, 100%, 40%);
    --color-green-500: hsl(145, 100%, 50%);
    --color-green-600: hsl(145, 100%, 60%);
    --color-green-700: hsl(145, 100%, 70%);
    --color-green-800: hsl(145, 100%, 80%);
    --color-green-900: hsl(145, 100%, 90%);

    --color-purple-100: hsl(300, 100%, 10%);
    --color-purple-200: hsl(300, 100%, 20%);
    --color-purple-300: hsl(300, 100%, 30%);
    --color-purple-400: hsl(300, 100%, 40%);
    --color-purple-500: hsl(300, 100%, 50%);
    --color-purple-600: hsl(300, 100%, 60%);
    --color-purple-700: hsl(300, 100%, 70%);
    --color-purple-800: hsl(300, 100%, 80%);
    --color-purple-900: hsl(300, 100%, 90%);

    --color-red-100: hsl(0, 100%, 10%);
    --color-red-200: hsl(0, 100%, 20%);
    --color-red-300: hsl(0, 100%, 30%);
    --color-red-400: hsl(0, 100%, 40%);
    --color-red-500: hsl(0, 100%, 50%);
    --color-red-600: hsl(0, 100%, 60%);
    --color-red-700: hsl(0, 100%, 70%);
    --color-red-800: hsl(0, 100%, 80%);
    --color-red-900: hsl(0, 100%, 90%);

    --spacing: 0.5rem;
  }

  html, body, #root {
    display: grid;
    grid-template: 'main' 1fr / 1fr;
    grid-area: main;
    overflow: hidden;

    background-color: var(--color-blue-100);
    color: var(--color-blue-800);
  }

  * {
    margin: 0;
    padding: 0;
  }
`;
