const assert = require('assert');

const runAssertions = () => {
  try {
    assert.strictEqual(1 + 1, 2);
    assert.ok(true);
    assert.throws(() => { throw new Error('test'); });
    return { passed: 3, failed: 0, description: 'Basic assertions passed' };
  } catch (error) {
    return { error: error.message };
  }
};

const testEquality = () => {
  try {
    assert.strictEqual(5, 5);
    assert.notStrictEqual(5, '5');
    return { test: 'equality', passed: true, description: 'Strict equality assertions' };
  } catch (error) {
    return { error: error.message };
  }
};

const testDeepEqual = () => {
  try {
    const obj1 = { a: 1, b: { c: 2 } };
    const obj2 = { a: 1, b: { c: 2 } };
    assert.deepStrictEqual(obj1, obj2);
    return { test: 'deepEqual', passed: true, description: 'Deep object comparison' };
  } catch (error) {
    return { error: error.message };
  }
};

const testThrows = () => {
  try {
    const fn = () => { throw new Error('Expected error'); };
    assert.throws(fn);
    return { test: 'throws', passed: true, description: 'Error throwing validation' };
  } catch (error) {
    return { error: error.message };
  }
};

const testTypes = () => {
  try {
    assert(typeof 5 === 'number');
    assert(typeof 'string' === 'string');
    assert(typeof true === 'boolean');
    return { test: 'types', passed: true, description: 'Type validation' };
  } catch (error) {
    return { error: error.message };
  }
};

const testCustomAssertions = () => {
  try {
    const value = 42;
    assert.ok(value > 0, 'Value must be positive');
    assert.ok(value < 100, 'Value must be less than 100');
    return { test: 'custom', passed: true, description: 'Custom assertion messages' };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  runAssertions,
  testEquality,
  testDeepEqual,
  testThrows,
  testTypes,
  testCustomAssertions,
};
