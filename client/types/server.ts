export type Server = {
  name: string;
  buffer: string;
  commands: { name: string; isRunning: boolean }[];
};
