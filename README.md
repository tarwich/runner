## Running

Simply run `npx runner` to run your Parcel-based client/server project. For
help, run `npx runner --help`. This example, uses [npx], but if you don't have
that, then you can add runner to a script in package.json, or run via
`./node_modules/.bin/runner`.

**package.json**
```json
"scripts": {
  "runner": "runner"
}
```

## Configuration

This system uses [comsiconfig] to parse configuration files.

[cosmiconfig]: https://www.npmjs.com/package/cosmiconfig

### Commands

You can setup commands by overriding `runner.commandPath` in your cosmiconfig,
and adding .js files to that folder.

A command must export `install` and `run`. The `install` method accepts a
[Commander] instance as the first parameter, which you can use to setup your
command.

[Commander]: https://www.npmjs.com/package/commander

**Example**
```js
function run() {
  console.log('This is the command!');
}

function install(program) {
  program.command('example')
  .description('An example command')
  .action(run);
}

module.exports = { install, run };

```
