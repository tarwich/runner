import { ReactNode } from 'react';
import styled from 'styled-components';

export type ButtonProps = {
  children?: ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = styled.button<ButtonProps>`
  display: flex;
  flex-direction: row;
  background-color: inherit;
  border: none;
  color: inherit;
  padding: 0.125em 0;
  gap: var(--spacing);
  cursor: pointer;

  :before {
    content: '';
    display: inline-block;
    border: 1px solid var(--color-blue-500);
    border-width: 1px 0px 1px 1px;
    height: 100%;
    width: 0.5em;
  }

  :after {
    content: '';
    display: inline-block;
    border: 1px solid var(--color-blue-500);
    border-width: 1px 1px 1px 0px;
    height: 100%;
    width: 0.5em;
  }

  &:hover {
    background-image: linear-gradient(
      to right,
      hsla(0, 0%, 100%, 0.05),
      hsla(0, 0%, 100%, 0.05)
    );
    color: var(--color-blue-900);

    :before,
    :after {
      border-color: var(--color-blue-700);
    }
  }
`;
