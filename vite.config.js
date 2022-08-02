// @ts-check
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import * as babelPluginStyledComponents from 'babel-plugin-styled-components';

console.log('babel-plugin-styled-components', babelPluginStyledComponents);

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            babelPluginStyledComponents,
            {
              displayName: true,
              fileName: false,
            },
          ],
        ],
      },
    }),
  ],
});
