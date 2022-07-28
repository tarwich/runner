import Ansi from 'ansi-to-react';
import React, { ReactNode, useEffect } from 'react';
import styled from 'styled-components';
import { Server } from '../types/server';
import { useServerStore } from './store/server.store';
import { Box } from './ui/box';

const Terminal = styled.div`
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  line-height: 1.5;
  padding: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  background-color: hsl(225, 25%, 20%);
  color: hsl(225, 25%, 70%);
  border-radius: 0.25rem;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1);
  height: 25em;
`;

type Props = {
  server: Server;
};

export const Console = (props: Props) => {
  const { server } = props;
  const { rpc } = useServerStore();
  const terminalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [server.buffer]);

  return (
    <Box>
      <h2>{server.name}</h2>
      <Terminal ref={terminalRef}>
        <Ansi>{server.buffer}</Ansi>
      </Terminal>
      <Box horizontal>
        {server.commands.map((command, i) => (
          <button
            key={i}
            onClick={() => {
              if (command.isRunning) {
                rpc.stopCommand(server.name, command.name);
              } else {
                rpc.runCommand(server.name, command.name);
              }
            }}
          >
            {command.name}
            {command.isRunning ? '(stop)' : ''}
          </button>
        ))}
      </Box>
    </Box>
  );
};
