const { log } = require('../log');
const { spawnSync } = require('child_process');
const { sync: globSync } = require('glob');
const { resolve } = require('path');

const { env } = process;

async function getDockerUrls() {
  if (!globSync(resolve('docker-compose.yml')).length) {
    env.DOCKER = 'ignore';
    log('docker', 'No docker-compose.yml. Not running docker');
  }

  if (!env.DOCKER) {
    {
      log('docker', 'Boot docker');
      const shell = spawnSync('docker-compose', ['up', '-d']);
      log('docker', String(shell.stderr));
    }

    {
      log('docker', 'Get docker ports');
      const shell = spawnSync('docker-compose', ['ps']);
      log('docker', String(shell.stderr));

      if (shell.stdout) {
        const services = String(shell.stdout)
          .split('\n')
          .map(line => {
            const [, name = ''] = line.match(/_([^_]+?)_\d+/) || [];
            /** @type {{[key: string]: string}} */
            const ports = (line.match(/\d+->\d+/g) || [])
              .map(assignment => assignment.match(/\d+/g) || [])
              .reduce(
                (ports, [container, host]) => ({
                  ...ports,
                  [host]: container,
                }),
                {}
              );
            /** @type {string?} */
            const defaultPort = Object.values(ports)[0];
            return { name, ports, defaultPort };
          })
          .filter(service => Boolean(service.defaultPort));

        // Add a fake service to the front of the array to handle a generic
        // DATABASE_URL
        if (services.length)
          services.unshift({
            name: 'database',
            ports: {},
            defaultPort: services[0].defaultPort,
          });

        services.forEach(service => {
          const { name, ports, defaultPort } = service;
          const uname = name.toUpperCase();
          const envKey = `${uname}_URL`;
          env[`${uname}_PORT`] = defaultPort || '';
          const envValue = env[envKey];

          if (envValue) {
            const [, envPort = ''] = envValue.match(/:(\d+)/) || [];
            const servicePort = ports[envPort] || service.defaultPort;
            env[envKey] = envValue.replace(`:${envPort}`, `:${servicePort}`);
            console.log('docker', `${envKey}: ${env[envKey]}`);
          } else
            console.log(
              'docker',
              `${service.name} port: ${service.defaultPort}`
            );
        });
      }
    }

    env.DOCKER = 'done';
  }
}

module.exports = { getDockerUrls };
