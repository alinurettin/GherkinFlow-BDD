const assert = require('assert');
const GherkinEngine = require('../src/gherkin_engine');

console.log('Running test suite for GherkinFlow-BDD...');

const engine = new GherkinEngine();

engine.defineStep(/^I have (\d+) items? in my cart$/, (world, count) => {
  world.cartCount = parseInt(count, 10);
});

engine.defineStep(/^I add (\d+) items? to my cart$/, (world, count) => {
  world.cartCount = (world.cartCount || 0) + parseInt(count, 10);
});

engine.defineStep(/^my cart should have (\d+) items?$/, (world, expected) => {
  assert.strictEqual(world.cartCount, parseInt(expected, 10));
});

const featureText = `Feature: E-Commerce Shopping Cart
  Scenario Outline: Adding items to cart
    Given I have <initial> items in my cart
    When I add <added> items to my cart
    Then my cart should have <expected> items

    Examples:
      | initial | added | expected |
      | 2       | 3     | 5        |
      | 0       | 1     | 1        |
`;

const ast = engine.parse(featureText);
assert.strictEqual(ast.scenarios.length, 2, 'Must expand 2 examples into scenarios');

const runResult = engine.execute(ast);
console.log('BDD Execution Result:', { status: runResult.status, passedScenarios: runResult.passedScenarios, steps: runResult.stepsSummary });
assert.strictEqual(runResult.status, 'PASSED');
assert.strictEqual(runResult.passedScenarios, 2);
assert.strictEqual(runResult.stepsSummary.passed, 6);
assert.strictEqual(runResult.stepsSummary.failed, 0);

console.log('✅ ALL TESTS PASSED (100% Assertion Rate)');
