import Ansi from 'ansi-to-react';
import React, { ReactNode, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Server } from '../types/server';
import { ExpandIcon } from './icon/expand-icon.svg';
import { useServerStore } from './store/server.store';
import { Box } from './ui/box';
import { Collapse } from './ui/collapse';
import { TurnDown } from './ui/turndown';
import { stopPropagation } from './util/stop-propagation';

const Terminal = styled.div<{ maximized?: boolean }>`
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
  display: flex;
  flex-direction: column-reverse;
`;

type Props = {
  server: Server;
};

export const ConsoleTitle = styled.h2`
  display: flex;
  place-items: center start;
  cursor: pointer;
  gap: 0.5em;
`;

export const ConsoleBox = styled(Box)<{ maximized?: boolean }>`
  display: grid;
  grid-template-rows: auto 1fr auto;

  ${(p) =>
    p.maximized &&
    css`
      position: absolute;
      background: white;
      top: 1rem;
      left: 1rem;
      right: 1rem;
      bottom: 1rem;

      ${ConsoleTitle} {
        ${TurnDown} {
          display: none;
        }
      }

      ${Collapse} {
        display: contents;
      }
    `}
`;

export const Console = (props: Props) => {
  const { server } = props;
  const { rpc } = useServerStore();
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [maximized, setMaximized] = React.useState(false);

  return (
    <ConsoleBox maximized={maximized}>
      <ConsoleTitle onClick={() => setExpanded(!expanded)}>
        <TurnDown expanded={expanded} />
        {server.name}
        <ExpandIcon
          onClick={stopPropagation((e) => setMaximized(!maximized))}
        />
      </ConsoleTitle>
      <Collapse expanded={expanded}>
        <Terminal ref={terminalRef} maximized={maximized}>
          <Ansi>{server.buffer}</Ansi>
        </Terminal>
      </Collapse>
      <Box horizontal overflow>
        {server.commands
          .concat({ name: 'clear', isRunning: false })
          .map((command, i) => (
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
    </ConsoleBox>
  );
};
