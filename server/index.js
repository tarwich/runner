require('dotenv').config();
const { resolve } = require('path');
const express = require('express');
const { createServer } = require('vite');
const ws = require('ws');
const { Socket } = require('./socket');
const { cosmiconfig } = require('cosmiconfig');

const ROOT = resolve(__dirname, '../') + '/';

async function main() {
  const app = express();
  /** @type {{config: import('./socket').ServerConfig}} */
  const { config } = await cosmiconfig('runner').search();
  const PORT = config.port || 8080;

  const viteServer = await createServer({
    root: ROOT,
    server: {
      middlewareMode: true,
      hmr: {
        port: Math.floor(Math.random() * (65535 - 1024)) + 1024,
      },
    },
  });

  app.use(viteServer.middlewares);

  const wss = new Socket();

  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);

    server.on('upgrade', (req, socket, head) => {
      // @ts-ignore
      wss.upgrade(req, socket, head);
    });
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
