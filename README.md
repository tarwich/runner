## Running

Simply run `npx runner` to run your Parcel-based client/server project. For
help, run `npx runner --help`. This example, uses [npx], but if you don't have
that, then you can add runner to a script in package.json, or run via
`./node_modules/.bin/runner`.

[npx]: https://www.npmjs.com/package/npx

### Add runner to `package.json[scripts]`

```json
"scripts": {
  "runner": "runner"
}
```

## Configuration

This system uses [cosmiconfig] to parse configuration files. You can add your
own configuration by adding a `runner` key to your package.json, or by creating
a `.runnerrc.js` file, or any other method that `CosmiConfig` supports.

[cosmiconfig]: https://www.npmjs.com/package/cosmiconfig

### Build Command

The build command will guess at configuration settings for client and server and
build them. You can override this by setting the `client` or `server` entries in
the config, or by adding an additional entry to `sources` in the config.

Configuration documentation:

```ts
{
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
    custom: string[];
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
```

### Additional Commands

You can add your own commands to Runner by overriding `runner.commandPath` in
your cosmiconfig, and adding .js files to that folder.

#### Example: Add commandPath to package.json[runner]

```json
"runner": {
  "commandPath": "tools/commands"
}
```

#### Command Class

A command must export `install` and `run`. The `install` method accepts a
[Commander] instance as the first parameter, which you can use to setup your
command. The `run` method is used when other commands want to run your command
directly. It should return a Promise so that other commands can await the result
of your command.

[commander]: https://www.npmjs.com/package/commander

**Example**

```js
function run() {
  console.log('This is the command!');
  return Promise.resolve(true);
}

function install(program) {
  program
    .command('example')
    .description('An example command')
    .action(run);
}

module.exports = { install, run };
```
