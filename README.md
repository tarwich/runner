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

### Commands

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

[Commander]: https://www.npmjs.com/package/commander

**Example**
```js
function run() {
  console.log('This is the command!');
  return Promise.resolve(true);
}

function install(program) {
  program.command('example')
  .description('An example command')
  .action(run);
}

module.exports = { install, run };
```
