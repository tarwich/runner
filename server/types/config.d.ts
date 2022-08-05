export type ServerConfig = {
  port: number;
  /** Limit to number of characters in the buffer (default, 20,000) */
  bufferSize: number;
  servers: Record<string, Server>;
};

export type Server = {
  cwd: string;
  commands: Record<string, string[]>;
};
