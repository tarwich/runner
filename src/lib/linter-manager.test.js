const { expect } = require('chai');
const { describe, it } = require('mocha');

describe('linter-manager', () => {
  it('should detect TypeScript', () => {
    const { gatherLinters } = require('./linter-manager');

    const linters = gatherLinters();

    expect(linters)
      .to.have.property('tsc')
      .that.has.property('enabled', true);
  });
});
