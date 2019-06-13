const { afterEach, describe, it } = require('mocha');
const { loadConfig } = require('../src/load-config');
const { expect } = require('chai');
const mockFs = require('mock-fs');

const PACKAGE_JSON = JSON.stringify({
  runner: {},
});

afterEach(() => {
  mockFs.restore();
});

describe('Config', () => {
  it('should auto-detect src/server/index.ts', async () => {
    mockFs({
      'server/index.ts': 'console.log("This is the server");',
      'src/server/index.ts': 'console.log("This is the server");',
      'src/server/index.js': 'console.log("This is the server");',
      'package.json': PACKAGE_JSON,
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    const server = config.sources.find(source => source.name === 'server');
    if (!server) throw new Error('"server" not found in sources');

    expect(server).to.have.property('entry', 'src/server/index.ts');
  });

  it('should auto-detect src/server/index.js', async () => {
    mockFs({
      'server/index.js': 'console.log("This is the server");',
      'src/server/index.js': 'console.log("This is the server");',
      'package.json': PACKAGE_JSON,
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    const server = config.sources.find(source => source.name === 'server');
    if (!server) throw new Error('"server" not found in sources');

    expect(server).to.have.property('entry', 'src/server/index.js');
  });

  it('should auto-detect server/index.js', async () => {
    mockFs({
      'server/index.js': 'console.log("This is the server");',
      'package.json': PACKAGE_JSON,
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    const server = config.sources.find(source => source.name === 'server');
    if (!server) throw new Error('"server" not found in sources');

    expect(server).to.have.property('entry', 'server/index.js');
  });

  it('should allow overriding sources in package.json', async () => {
    mockFs({
      'src/server/index.js': 'console.log("This is the server");',
      'src/client/index.html': '<div>CLIENT</div>',
      'package.json': JSON.stringify({
        runner: {
          sources: [
            { name: 'server', entry: 'a/b/foo.xyz' },
            { name: 'client', entry: 'a/b/bar.xyz' },
          ],
        },
      }),
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    // Server
    const server = config.sources.find(source => source.name === 'server');
    if (!server) throw new Error('"server" not found in sources');
    expect(server).to.have.property('entry', 'a/b/foo.xyz');

    // Client
    const client = config.sources.find(source => source.name === 'client');
    if (!client) throw new Error('"client" not found in sources');
    expect(client).to.have.property('entry', 'a/b/bar.xyz');
  });

  it('should auto-detect src/client/index.html', async () => {
    const files = {
      'index.html': '<div>Client</div>',
      'index.ts': 'console.log("This is the client");',
      'index.js': 'console.log("This is the client");',
    };

    mockFs({
      client: files,
      'src/client': files,
      'package.json': PACKAGE_JSON,
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    const client = config.sources.find(source => source.name === 'client');
    if (!client) throw new Error('"client" not found in sources');

    expect(client).to.have.property('entry', 'src/client/index.html');
  });

  it('should auto-detect client/index.html', async () => {
    mockFs({
      'src/client': {},
      'client/index.html': '<div>Client</div>',
      'client/index.ts': 'console.log("This is the client");',
      'client/index.js': 'console.log("This is the client");',
      'package.json': PACKAGE_JSON,
    });

    const config = loadConfig();

    expect(config)
      .to.have.property('sources')
      .that.is.an('array');

    const client = config.sources.find(source => source.name === 'client');
    if (!client) throw new Error('"client" not found in sources');

    expect(client).to.have.property('entry', 'client/index.html');
  });
});
