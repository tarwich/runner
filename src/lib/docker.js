const { log } = require('../log');
const { spawnSync } = require('child_process');

const { env } = process;

async function getDockerUrls() {
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
        const services = String(shell.stdout).split('\n').map(line => {
          const [, name, port] = line.match(/_([^_]+?)_\d+.*?(\d+)->/) || [];
          return { name, port };
        })
        .filter(service => service.port);

        // Add a fake service to the front of the array to handle a generic
        // DATABASE_URL
        if (services.length)
          services.unshift({ name: 'database', port: services[0].port });

        services.forEach(service => {
          const name = service.name.toUpperCase();
          const envKey = `${name}_URL`;
          env[`${name}_PORT`] = service.port;

          if (env[envKey]) {
            env[envKey] = env[envKey].replace(/:\d+\//, `:${service.port}/`);
            log('docker', `${envKey}: ${env[envKey]}`);
          }
          else log('docker', `${service.name} port: ${service.port}`);
        });
      }
    }

    env.DOCKER = 'done';
  }
}

module.exports = { getDockerUrls };
