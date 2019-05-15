// @ts-check
const { existsSync, readdirSync, readFileSync, statSync } = require('fs');
const { spawn } = require('child_process');
const { parse, resolve } = require('path');
const { valid, validRange } = require('semver');
const { lint } = require('../config');
const languages = require('linguist-languages');

class Linter {
  constructor() {
    this.name = '';
    const className = this.constructor.name;

    /** @param {any[]} rest */
    this.log = (...rest) => console.log(`[${this.name || className}]`, ...rest);
  }

  /**
   * @param {string} command The command to resolve
   */
  resolveCommand(command) {
    return resolve(
      'node_modules/.bin',
      `${command}${process.platform === 'win32' ? '.cmd' : ''}`
    );
  }

  /**
   *
   * @param {string} command The command to run
   * @param {string[]} args Arguments for the command
   * @param {object} options See below
   * @param {'inherit'|'pipe'} [options.stdio] How to deal with the stdio
   */
  spawn(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        env: process.env,
        stdio: 'pipe',
        ...options,
      });

      child.on('exit', code => {
        const stdout = (child.stdout && child.stdout.read()) || '';
        const stderr = (child.stderr && child.stderr.read()) || '';
        const stdio = `${stdout}${stderr}`.trim();

        if (code) reject(stdio);
        else resolve(stdio);
      });
      child.on('error', reject);
    });
  }
}

class caretLinter extends Linter {
  constructor() {
    super();
    this.packageJsonPath = resolve('package.json');
    this.enabled = existsSync(this.packageJsonPath);
  }

  async run() {
    /** @type {{
     *   dependencies: {[key: string]: string},
     *   devDependencies: {[key: string]: string},
     * }} */
    const pkg = JSON.parse(readFileSync(this.packageJsonPath, 'utf-8'));
    const { carets: caret } = lint;

    const { dependencies, devDependencies } = pkg;

    this.log(
      `Checking ${['dependencies', 'devDependencies']
        .filter(
          /** @param {keyof typeof caret} dependency */
          dependency => caret[dependency]
        )
        .join('and')}...`
    );

    const checkers = {
      strict:
        /** @param {[string, string]} options */
        ([name, version]) => ({
          name,
          version,
          problem: valid(version) ? '' : 'Should be absolute',
        }),
      range:
        /** @param {[string, string]} options */
        ([name, version]) => ({
          name,
          version,
          problem: !valid(version) ? '' : 'Should be a range',
        }),
      ignore:
        /** @param {[string, string]} options */
        ([name, version]) => ({
          name,
          version,
          problem: '',
        }),
    };

    /**
     * @param {keyof typeof pkg} category
     */
    const getChecker = category => {
      const type = caret[category];

      if (checkers[type]) return checkers[type];
      else {
        return /** @param {[string, string]} options */ ([name, version]) => ({
          name,
          version,
          problem: `Invalid type "${type}" for ${category}`,
        });
      }
    };

    const toCheck = [
      caret.dependencies ? Object.entries(dependencies) : [],
      caret.devDependencies ? Object.entries(devDependencies) : [],
    ]
      .flat()
      .filter(([name, version]) => validRange(version));

    const results = [
      Object.entries(dependencies)
        .filter(([name, version]) => validRange(version))
        .map(getChecker('dependencies')),
      Object.entries(devDependencies)
        .filter(([name, version]) => validRange(version))
        .map(getChecker('devDependencies')),
    ].flat();

    const problems = results.filter(entry => entry.problem);

    this.log(
      `Checked ${toCheck.length} dependencies. Found ${
        problems.length
      } dependencies with problems`
    );

    if (problems.length) {
      return Promise.reject(
        problems
          .map(
            ({ name, version, problem }) => `${name}: ${version} (${problem})`
          )
          .join('\n')
      );
    }
  }
}

class CustomLinter extends Linter {
  /**
   * @param {string} name Name of the custom linter
   * @param {string} path Path to the .js file to run
   */
  constructor(name, path) {
    super();
    this.name = name;
    this.path = path;

    this.enabled = Object.keys(lint.custom).length > 0;
  }

  static gather() {
    return Object.keys(lint.custom).reduce(
      (result, key) => ({
        ...result,
        [key]: new CustomLinter(key, lint.custom[key]),
      }),
      {}
    );
  }

  run() {
    this.log(`Running custom "${this.name}" linter (${this.path})`);

    return this.spawn('node', [resolve(this.path)]).catch(error =>
      Promise.reject(error)
    );
  }
}

class PrettierLinter extends Linter {
  constructor() {
    super();

    this.languages = Object.keys(languages).reduce(
      /** @param {keyof typeof languages} name */
      (result, name) => ({
        [name.toLowerCase()]: languages[name],
      }),
      {}
    );

    this.command = this.resolveCommand('prettier');
    this.enabled = existsSync(this.command);
  }

  run() {
    const supportedLanguages = [
      languages.JavaScript,
      languages.JSX,
      languages.Vue,
      languages.TypeScript,
      languages.CSS,
      languages.Less,
      languages.SCSS,
      languages.HTML,
      languages.JSON,
      languages.GraphQL,
      languages.Markdown,
      languages.YAML,
    ];
    const extensions = supportedLanguages
      .flatMap(language => language.extensions || [])
      .join(',');

    lint.prettier.paths
      .map(path => path.replace('$EXTENSIONS', `*{${extensions}}`))
      .forEach(path => this.log(`Checking ${path}`));

    return this.spawn(this.command, [
      '--check',
      ...lint.prettier.paths.map(path =>
        path.replace('$EXTENSIONS', `*{${extensions}}`)
      ),
    ]);
  }
}

class TSCLinter extends Linter {
  constructor() {
    super();

    this.command = this.resolveCommand('tsc');
    this.enabled = existsSync(this.command);
  }

  /**
   * @param {string} path The path to search
   * @param {string} filter The file to find
   *
   * @return {string[]} Found files
   */
  recursiveSearch(path, filter) {
    if (parse(path).base === 'node_modules') return [];

    const files = readdirSync(path)
      .map(file => resolve(path, file))
      .flatMap(file => {
        if (statSync(file).isDirectory())
          return this.recursiveSearch(file, filter);
        else return file;
      })
      .filter(file => parse(file).base === filter);

    return files;
  }

  async run() {
    // Find the tsconfig files
    const tsConfigFiles = this.recursiveSearch(resolve('.'), 'tsconfig.json');

    return Promise.all(
      tsConfigFiles.map(file => {
        this.log(`Linting ${file}...`);
        return this.spawn(this.command, ['--project', file, '--noEmit']);
      })
    ).then(array => array.filter(Boolean));
  }
}

function gatherLinters() {
  const linters = {
    carets: new caretLinter(),
    tsc: new TSCLinter(),
    prettier: new PrettierLinter(),
    ...CustomLinter.gather(),
  };

  return linters;
}

module.exports = {
  gatherLinters,
};
