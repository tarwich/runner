export type ServerConfig = {
  port: number;
  servers: Record<string, Server>;
};

export type Server = {
  cwd: string;
  commands: Record<string, string[]>;
};
