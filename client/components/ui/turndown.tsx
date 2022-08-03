import styled, { css } from 'styled-components';
import { RightArrowIcon } from '../icon/right-arrow-icon.svg';

export type TurndownProps = {
  expanded: boolean;
};

export const TurnDown = styled(RightArrowIcon)<TurndownProps>`
  cursor: pointer;
  transform-origin: center;
  transform: rotate(${(p) => (p.expanded ? '90deg' : '0deg')});
  transition: transform 0.2s ease-in-out;
`;
