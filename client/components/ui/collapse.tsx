import styled from 'styled-components';

export type CollapseProps = {
  expanded: boolean;
};

export const Collapse = styled.div<CollapseProps>`
  display: flex;
  flex-direction: column;
  max-height: ${(p) => (p.expanded ? '100%' : '0')};
  overflow: hidden;
  transition: max-height 0.2s ease-in-out;
`;
