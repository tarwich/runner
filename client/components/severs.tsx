import React from 'react';
import { Console } from './console';
import { useServerStore } from './store/server.store';
import { Box } from './ui/box';

export const Servers = () => {
  const servers = useServerStore();

  return (
    <Box>
      <h1>Servers</h1>
      {servers.servers?.map((server) => (
        <Console key={server.name} server={server} />
      ))}
    </Box>
  );
};
