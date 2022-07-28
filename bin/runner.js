#!/usr/bin/env node
const { resolve } = require('path');

const INDEX = resolve(__dirname, '../server/index.js');

require(INDEX);
