import { ParcelOptions } from 'parcel-bundler';

export type DependencyType = 'strict' | 'range' | 'ignore';

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
    /** True if this entry utilizes docker */
    docker: boolean;
    /** The parcel configuration options */
    parcel: ParcelOptions;
  };
  sources: {
    /** Name to display in any output related to this source (optional) */
    name: string;
    /** True if this entry utilizes docker */
    docker?: boolean;
    /** True if this item emits a runnable file */
    run?: boolean;
    /** The entry file for the server compilation */
    entry: string;
    /** The parcel configuration options */
    parcel: ParcelOptions;
  }[];
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
    custom: {[key: string]: string};
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
