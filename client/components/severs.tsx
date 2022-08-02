import React from 'react';
import styled from 'styled-components';
import { Console } from './console';
import { useServerStore } from './store/server.store';
import { Box } from './ui/box';

const ServersBox = styled(Box).attrs({ grid: true })`
  max-height: 100%;
  overflow: auto;
`;

export const Servers = () => {
  const servers = useServerStore();

  return (
    <ServersBox>
      <h1>Servers</h1>
      {servers.servers?.map((server) => (
        <Console key={server.name} server={server} />
      ))}
    </ServersBox>
  );
};
