import Ansi from 'ansi-to-react';
import React, { ReactNode, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Server } from '../types/server';
import { ExpandIcon } from './icon/expand-icon.svg';
import { useServerStore } from './store/server.store';
import { Box } from './ui/box';
import { Button } from './ui/button';
import { Collapse } from './ui/collapse';
import { TurnDown } from './ui/turndown';
import { stopPropagation } from './util/stop-propagation';

const CommandButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})<{ active?: boolean }>`
  ${(p) =>
    p.active &&
    css`
      color: var(--color-green-300);

      :before,
      :after {
        border-color: var(--color-green-200);
      }

      :hover {
        color: var(--color-green-500);

        :before,
        :after {
          border-color: var(--color-green-500);
        }
      }
    `}
`;

const Terminal = styled.div<{ maximized?: boolean }>`
  font-family: 'Fira Code', monospace;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
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
  z-index: 1;
`;

type Props = {
  server: Server;
};

export const ConsoleTitle = styled.div`
  display: flex;
  place-items: center start;
  gap: 0.5em;

  h2 {
    cursor: pointer;
  }

  :before,
  :after {
    content: '';
    width: 0.25em;
  }

  ${Box} {
    margin-left: auto;
  }
`;

export const ConsoleBox = styled(Box)<{ maximized?: boolean }>`
  display: grid;
  grid-template-rows: auto 1fr auto;

  ${(p) =>
    p.maximized &&
    css`
      position: absolute;
      background: var(--color-blue-200);
      top: 1rem;
      left: 1rem;
      right: 1rem;
      bottom: 1rem;
      border-radius: 0.25rem;

      ${ConsoleTitle} {
        cursor: initial;

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
      <ConsoleTitle>
        <TurnDown expanded={expanded} onClick={() => setExpanded(!expanded)} />
        <h2 onClick={() => setExpanded(!expanded)}>{server.name}</h2>
        <ExpandIcon
          onClick={stopPropagation((e) => setMaximized(!maximized))}
        />
        <Box horizontal>
          {server.commands
            .concat({ name: 'clear', isRunning: false })
            .map((command, i) => (
              <CommandButton
                key={i}
                active={command.isRunning}
                onClick={() => {
                  if (command.isRunning) {
                    rpc.stopCommand(server.name, command.name);
                  } else {
                    rpc.runCommand(server.name, command.name);
                  }
                }}
              >
                {command.name}
              </CommandButton>
            ))}
        </Box>
      </ConsoleTitle>
      <Collapse expanded={expanded}>
        <Terminal ref={terminalRef} maximized={maximized}>
          <Ansi>{server.buffer}</Ansi>
        </Terminal>
      </Collapse>
    </ConsoleBox>
  );
};
