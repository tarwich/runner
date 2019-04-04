import { ParcelOptions } from 'parcel-bundler';

export declare interface Config {
  /** The path to additional command files */
  commandPath: string[];
  client: {
    /** The entry file for the client compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: ParcelOptions;
  };
  /** Arguments to add when running the server */
  runArguments: string[];
  server: {
    /** The entry file for the server compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: ParcelOptions;
  };
  sources: {
    /** Name to display in any output related to this source (optional) */
    name: string;
    /** True if this item emits a runnable file */
    run?: boolean;
    /** The entry file for the server compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: ParcelOptions;
  }[];
}
