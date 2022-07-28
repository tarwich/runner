import React from 'react';
import { Bootstrap } from './components/bootstrap';
import { createRoot } from 'react-dom/client';

const rootNode =
  document.querySelector('#root') ||
  document.body.appendChild(document.createElement('div'));
rootNode.id = 'root';

const root = createRoot(rootNode);

root.render(<Bootstrap />);
