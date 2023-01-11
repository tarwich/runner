import { makeSocketRpc, Rpc } from '@tarwich/bidi-rpc';
import create from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Server } from '../../types/server';

type RemoteRpc = {
  list(): { name: string; commands: string[] }[];
  runCommand(serverName: string, command: string): Promise<void>;
  getBuffer(serverName: string): Promise<string>;
  isRunning(serverName: string, command: string): Promise<boolean>;
  stopCommand(serverName: string, command: string): void;
};

export type ServerStore = {
  servers: Server[];
  rpc: Rpc<RemoteRpc>;
} & {
  // (Functions go here)
  setServers(servers: Server[]): void;
};

export const useServerStore = create(
  immer<ServerStore>((set, get) => {
    const host = location.host;
    const socket = new WebSocket(`ws://${host}`);
    const rpc = makeSocketRpc<RemoteRpc>(socket, {
      data: (serverName: string, command: string, data: string) => {
        try {
          set((state) => {
            const server = state.servers.find((s) => s.name === serverName);

            server.buffer = (server.buffer || '') + data;
          });
        } catch (e) {
          console.error(e);
        }
      },

      status: (serverName: string, command: string, isRunning: boolean) => {
        try {
          set((state) => {
            const server = state.servers.find((s) => s.name === serverName);

            const commandIndex = server.commands.findIndex(
              (c) => c.name === command
            );

            if (commandIndex === -1) {
              server.commands.push({ name: command, isRunning });
            } else {
              server.commands[commandIndex].isRunning = isRunning;
            }
          });
        } catch (e) {
          console.error(e);
        }
      },

      clear: (serverName: string) => {
        try {
          set((state) => {
            const server = state.servers.find((s) => s.name === serverName);

            server.buffer = '';
          });
        } catch (e) {
          console.error(e);
        }
      },
    });

    socket.addEventListener(
      'open',
      async () => {
        const servers = await rpc.list();

        set({
          servers: servers.map((s) => ({
            name: s.name,
            buffer: '',
            commands: s.commands.map((c) => ({
              name: c,
              isRunning: false,
            })),
          })),
        });

        for (const server of servers) {
          const buffer = await rpc.getBuffer(server.name);

          set((state) => {
            const existing = state.servers.find((s) => s.name === server.name);

            existing.buffer = buffer || '';
          });

          for (const command of server.commands) {
            try {
              const isRunning = await rpc.isRunning(server.name, command);

              set((state) => {
                const existing = state.servers.find(
                  (s) => s.name === server.name
                );

                existing.commands = existing.commands.map((c) =>
                  c.name === command ? { ...c, isRunning } : c
                );
              });
            } catch (error) {
              console.error(error);
            }
          }
        }
      },
      { once: true }
    );

    const setServers = (servers: Server[]) => {
      set({ servers });
    };

    return {
      servers: [],
      rpc,
      setServers,
    };
  })
);
