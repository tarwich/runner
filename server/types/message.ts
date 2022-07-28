export type ServerListMessage = {
  kind: 'server.list';
};

export type ServerRunMessage = {
  kind: 'server.run';
  server: string;
  command: string;
};

export type Message = ServerListMessage | ServerRunMessage;
