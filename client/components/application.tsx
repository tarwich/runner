import React from 'react';
import { Servers } from './severs';
import { Box } from './ui/box';

export const Application = () => {
  return (
    <Box>
      <h1>Runner</h1>
      <Servers />
    </Box>
  );
};
