const { makeSocketRpc } = require('@tarwich/bidi-rpc');
const { spawn, ChildProcess } = require('child_process');
const ws = require('ws');

const MODULE_NAME = 'runner';

/**
 * @typedef {import('./types/config').ServerConfig} ServerConfig
 */
const { cosmiconfig } = require('cosmiconfig');

/**
 * @type {Record<string, string>}
 */
const buffers = {};

/**
 * @type {{serverName: string, command: string, child: ChildProcess}[]}
 */
const processes = [];

/**
 * @typedef {import('./types/message').Message} Message
 */

class Socket {
  constructor() {
    this.wss = new ws.Server({ noServer: true });

    this.wss.on('connection', (ws, request) => {
      console.log(`Receiving connection from ${request.socket.remoteAddress}`);
      new RunnerRpc(ws);
    });
  }

  upgrade(
    /** @type {import('http').IncomingMessage} */ req,
    /** @type {import('net').Socket} */ socket,
    /** @type {Buffer} */ head
  ) {
    this.wss.handleUpgrade(req, socket, head, (ws) => {
      this.wss.emit('connection', ws, req);
    });
  }
}

/**
 * @typedef {object} RemoteRpc
 * @property {(server: string, command: string, data: string) => void} data
 * @property {(server: string, command: string, isRunning: boolean) => void} status
 * @property {(server: string) => void} clear
 */

class RunnerRpc {
  bufferSize = 20_000;

  /**
   * @param {import('@tarwich/bidi-rpc').ISocket} socket
   */
  constructor(socket) {
    this.socket = socket;
    /**
     * @type {import('@tarwich/bidi-rpc').Rpc<RemoteRpc>}
     */
    this.remote = makeSocketRpc(socket, this);

    cosmiconfig(MODULE_NAME)
      .search()
      .then(({ config }) => {
        if (config) {
          this.bufferSize = config.bufferSize;
        }
      });
  }

  /** @private */
  async readServers() {
    /** @type {{config: ServerConfig, filepath: string, isEmpty?: boolean}} */
    const { config, filepath, isEmpty } = await cosmiconfig(
      MODULE_NAME
    ).search();

    console.log(`Loaded config from ${filepath}`);

    if (isEmpty) {
      console.log('No config found');
    } else {
      const serverCount = Object.keys(config.servers).length;

      console.log(`Found ${serverCount} servers`);
    }

    return config.servers;
  }

  /**
   * @param {keyof ServerConfig['servers']} serverName
   */
  async getServer(serverName) {
    const data = await this.readServers();

    return data[serverName];
  }

  async list() {
    const data = await this.readServers();

    const servers = Object.entries(data).map(([name, server]) => ({
      name,
      commands: Object.keys(server.commands),
    }));

    return servers;
  }

  /**
   * @param {string} serverName
   */
  async getBuffer(serverName) {
    return buffers[serverName] || '';
  }

  /**
   * @param {keyof ServerConfig} serverName
   * @param {string} command
   */
  async isRunning(serverName, command) {
    const process = processes.find(
      (process) =>
        process.serverName === serverName && process.command === command
    );

    return process?.child?.pid > 0;
  }

  /**
   * @param {keyof ServerConfig} serverName
   * @param {string} command
   */
  async runCommand(serverName, command) {
    const server = await this.getServer(serverName);

    if (!server) {
      throw new Error(`Server ${serverName} not found`);
    }

    const { commands } = server;

    // Special case for clear command
    if (command === 'clear') {
      buffers[serverName] = '';
      this.remote.clear(serverName);
      return;
    }

    if (!commands[command]) {
      throw new Error(`Command ${command} not found`);
    }

    const cwd = server.cwd;
    const commandText = commands[command];

    console.log('Running command', { serverName, command, cwd, commandText });

    const child = spawn(commandText[0], commandText.slice(1), {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    processes.push({ serverName, command, child });

    this.remote.status(serverName, command, true);

    child.on('error', (error) => {
      console.error(error);
    });

    child.on('exit', (code) => {
      const message = `Command ${serverName}.${command} exited with code ${code}`;
      console.log(message);
      this.remote.data(serverName, command, message);
      this.remote.status(serverName, command, false);
    });

    child.on('close', (code) => {
      const message = `Command ${command} closed with code ${code}`;
      console.log(message);
      this.remote.data(serverName, command, message);
      this.remote.status(serverName, command, false);

      const index = processes.findIndex((process) => process.child === child);
      processes.splice(index, 1);
    });

    child.on('disconnect', () => {
      console.log(`Command ${command} disconnected`);
    });

    child.stdout.on('data', (data) => {
      buffers[serverName] = (buffers[serverName] || '') + data;
      // Truncate the buffer
      buffers[serverName] = buffers[serverName].slice(-this.bufferSize);
      this.remote.data(serverName, command, data.toString()).catch((error) => {
        console.error(error);
      });
    });

    child.stderr.on('data', (data) => {
      buffers[serverName] = (buffers[serverName] || '') + data;
      // Truncate the buffer
      buffers[serverName] = buffers[serverName].slice(-this.bufferSize);
      this.remote.data(serverName, command, data.toString()).catch((error) => {
        console.error(error);
      });
    });
  }

  /**
   * @param {keyof ServerConfig} serverName
   * @param {string} command
   */
  stopCommand(serverName, command) {
    try {
      const existing = processes.find(
        (process) =>
          process.serverName === serverName && process.command === command
      );

      if (!existing) {
        throw new Error(`Command ${command} not found`);
      }

      const { child } = existing;

      process.kill(-child.pid);
    } catch (error) {
      console.error(error);
    }
  }
}

process.once('exit', () => {
  processes.forEach((child) => {
    process.kill(-child.child.pid);
  });
});

process.on('SIGINT', () => {
  process.exit(0);
});

module.exports = { Socket };
