import React from 'react';
import { ReactNode } from 'react';
import styled, { css } from 'styled-components';

export type BoxProps = {
  children?: ReactNode;

  grid?: boolean;
  vertical?: boolean;
  horizontal?: boolean;
};

export const Box = styled.div<BoxProps>`
  ${(p) => {
    const { grid, vertical, horizontal } = p;

    if (grid) {
      return css`
        display: grid;
        grid-auto-flow: ${vertical ? 'column' : 'row'};
      `;
    }

    return css`
      display: flex;
      flex-direction: ${horizontal ? 'row' : 'column'};
    `;
  }}

  gap: var(--spacing);
`;
