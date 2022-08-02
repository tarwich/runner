import React, { PropsWithRef } from 'react';
import { Icon } from './icon';

type RightArrowProps = {} & PropsWithRef<JSX.IntrinsicElements['svg']>;

export const RightArrowIcon = (props: RightArrowProps) => (
  <Icon {...props}>
    <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" />
  </Icon>
);
