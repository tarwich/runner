import { ParcelOptions } from 'parcel-bundler';

export type DependencyType = 'strict' | 'range' | 'ignore';

export declare interface Source {
  /** Name to display in any output related to this source (optional) */
  name: string;
  /** True if this entry utilizes docker (default: false) */
  docker?: boolean;
  /** True if this item emits a runnable file (default: false) */
  run?: boolean;
  /** Optional list of arguments to pass to the forked process */
  runArguments?: string[];
  /** The entry file for the server compilation */
  entry: string;
  /** The parcel configuration options */
  parcel: ParcelOptions;
}

export declare interface Config {
  /** The path to additional command files */
  commandPath: string[];
  client: Partial<Source>;
  /** Arguments to add when running the server */
  runArguments: string[];
  server: Partial<Source>;
  sources: Partial<Source>[];
  /** Rules for linters */
  lint: {
    carets: {
      /**
       * How to handle dependencies
       * - strict: Must be a specific version such as 1.0.0
       * - range: Must be a range such as ^1.0.0
       * - ignore: Will not be checked
       */
      dependencies: DependencyType;
      /**
       * How to handle dependencies
       * - strict: Must be a specific version such as 1.0.0
       * - range: Must be a range such as ^1.0.0
       * - ignore: Will not be checked
       */
      devDependencies: DependencyType;
    };
    /** Array of additional linters to run. Should be paths to .js files */
    custom: { [key: string]: string };
    /** Configuration settings for prettier */
    prettier: {
      /**
       * Paths to run prettier on. You can use $EXTENSIONS in the path to add
       * all supported extensions, or you can add your own. This is an array of
       * glob expressions.
       */
      paths: string[];
    };
  };
}
