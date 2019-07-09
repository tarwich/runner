const { describe, it } = require('mocha');
const { parseDockerPs, replaceEnvVars } = require('../src/lib/docker');
const assert = require('assert');

describe('Docker detection', async function() {
  const dockerProcesses = parseDockerPs(
    `
  Name                     Command            State                          Ports
  ---------------------------------------------------------------------------------------------------------------
  runner_node_1            docker-entrypoint.sh node   Exit 0
  runner_postgres-test_1   nc -l 5432                  Up       0.0.0.0:32795->5432/tcp
  runner_postgres_1        nc -l 5432                  Up       0.0.0.0:32796->5432/tcp
  runner_rabbit-mq_1       nc -l 5672 15672            Up       0.0.0.0:32797->15672/tcp, 0.0.0.0:32798->5672/tcp
`
      .split('\n')
      .map(line => line.trim())
      .join('\n')
  );

  /**
   *
   * @param {string} name The name of the docker entry to match
   * @param {string} envKey The environment key (example: POSTGRES_URL)
   * @param {string} envValue The default value in the .env file
   */
  function checkDockerConfig(name, envKey, envValue) {
    process.env[envKey] = envValue;

    replaceEnvVars(dockerProcesses);
    const [, envPort = ''] = envValue.match(/:(\d+)/) || [];
    const { host = '0000' } =
      (dockerProcesses[name] || { ports: [] }).ports.find(
        port => port.container === envPort
      ) || {};

    assert.equal(
      process.env[envKey],
      String(process.env[envKey]).replace(/:\d+/, `:${host}`)
    );
  }

  it('Should update POSTGRES_URL', () => {
    checkDockerConfig(
      'postgres',
      'POSTGRES_URL',
      'postgres://user:pass@localhost:5432/db'
    );
  });
  it('Should update POSTGRES_TEST_URL', () => {
    checkDockerConfig(
      'postgres-test',
      'POSTGRES_TEST_URL',
      'postgres://user:pass@localhost:5432/db'
    );
  });
  it('Should update DATABASE_URL', () => {
    checkDockerConfig(
      'postgres',
      'DATABASE_URL',
      'postgres://user:pass@localhost:5432/db'
    );
  });
  it('Should update RABBIT_URL', () => {
    checkDockerConfig('rabbit-mq', 'RABBIT_URL', 'amqp://localhost:5672');
  });
  it('Should update RABBIT_MANAGEMENT_URL', () => {
    checkDockerConfig(
      'rabbit-mq',
      'RABBIT_MANAGEMENT_URL',
      'http://guest:guest@localhost:15672/db'
    );
  });
  it('Should not crash with NONEXISTENT_URL', () => {
    checkDockerConfig(
      'nonexistent',
      'NONEXISTENT_URL',
      'http://nonexistent.com'
    );
  });
});
