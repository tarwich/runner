## Configuration

This system uses [comsiconfig] to parse configuration files.

[cosmiconfig]: https://www.npmjs.com/package/cosmiconfig

### Modules

You can add your own modules to the system by adding the configuration property
`modulePath` with a path to the folder where your modules are stored, and adding
the property `modules` which is an array of the names of the modules you would
like to be detected.
