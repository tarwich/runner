# Runner

This is a project to make it easier to run projects in a monorepo

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

### Configuration format

```json
{
  "frontend": {
    "cwd": "frontend",
    "commands": {
      "start": ["npm", "run", "start:dev"],
      "install": "npm install"
    }
  },
  "api": {
    "cwd": "api",
    "commands": {
      "start": ["npm", "run", "start:dev"],
      "install": "npm install"
    }
  },
  "postgres": {
    "cwd": "",
    "commands": {
      "start": ["docker", "compose", "up", "postgres"]
    }
  }
}
```
