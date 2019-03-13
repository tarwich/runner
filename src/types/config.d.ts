export declare interface Config {
  /** The path to additional command files */
  commandPath: string[];
  client: {
    /** The entry file for the client compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: object;
  },
  /** Arguments to add when running the server */
  runArguments: string[];
  server: {
    /** The entry file for the server compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: object;
  }
}
