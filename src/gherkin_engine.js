// GherkinFlow-BDD: Streaming Gherkin Compiler & Step Runtime
class GherkinEngine {
  constructor() {
    this.stepDefinitions = [];
  }

  defineStep(pattern, handlerFn) {
    const regex = typeof pattern === 'string' ? new RegExp('^' + pattern.replace(/\{string\}/g, '"([^"]+)"').replace(/\{int\}/g, '(\\d+)') + '$') : pattern;
    this.stepDefinitions.push({ regex, handlerFn });
  }

  /**
   * Parse raw Gherkin text into AST
   */
  parse(gherkinText) {
    const lines = gherkinText.split('\n');
    let featureName = '';
    const scenarios = [];
    let currentScenario = null;
    let isParsingExamples = false;
    let exampleHeaders = [];

    for (let rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('Feature:')) {
        featureName = line.replace('Feature:', '').trim();
      } else if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
        isParsingExamples = false;
        currentScenario = {
          name: line.replace(/Scenario( Outline)?:/, '').trim(),
          isOutline: line.startsWith('Scenario Outline:'),
          steps: [],
          examples: []
        };
        scenarios.push(currentScenario);
      } else if (line.startsWith('Examples:')) {
        isParsingExamples = true;
        exampleHeaders = [];
      } else if (isParsingExamples && line.startsWith('|')) {
        const row = line.split('|').slice(1, -1).map(s => s.trim());
        if (exampleHeaders.length === 0) {
          exampleHeaders = row;
        } else {
          const item = {};
          exampleHeaders.forEach((h, idx) => item[h] = row[idx]);
          currentScenario.examples.push(item);
        }
      } else if (currentScenario && /^(Given|When|Then|And|But)\s/.test(line)) {
        const m = line.match(/^(Given|When|Then|And|But)\s+(.*)$/);
        currentScenario.steps.push({
          keyword: m[1],
          text: m[2]
        });
      }
    }

    const expandedScenarios = [];
    for (const sc of scenarios) {
      if (sc.isOutline && sc.examples.length > 0) {
        sc.examples.forEach((ex, idx) => {
          let name = sc.name;
          const steps = sc.steps.map(s => {
            let replacedText = s.text;
            for (const [k, v] of Object.entries(ex)) {
              replacedText = replacedText.replace(new RegExp('<' + k + '>', 'g'), v);
              name = name.replace(new RegExp('<' + k + '>', 'g'), v);
            }
            return { keyword: s.keyword, text: replacedText };
          });
          expandedScenarios.push({ name: name + ' (Example #' + (idx + 1) + ')', steps });
        });
      } else {
        expandedScenarios.push(sc);
      }
    }

    return {
      feature: featureName,
      scenarios: expandedScenarios
    };
  }

  /**
   * Execute parsed feature with registered step definitions
   */
  execute(ast, initialWorld = {}) {
    const results = [];
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    for (const scenario of ast.scenarios) {
      const world = { ...initialWorld };
      const stepResults = [];
      let scenarioFailed = false;

      for (const step of scenario.steps) {
        if (scenarioFailed) {
          stepResults.push({ ...step, status: 'SKIPPED' });
          totalSkipped++;
          continue;
        }

        const matchDef = this.stepDefinitions.find(d => d.regex.test(step.text));
        if (!matchDef) {
          scenarioFailed = true;
          stepResults.push({ ...step, status: 'FAILED', error: 'Undefined step definition' });
          totalFailed++;
          continue;
        }

        const match = step.text.match(matchDef.regex);
        const args = match.slice(1);

        try {
          matchDef.handlerFn(world, ...args);
          stepResults.push({ ...step, status: 'PASSED' });
          totalPassed++;
        } catch (err) {
          scenarioFailed = true;
          stepResults.push({ ...step, status: 'FAILED', error: err.message });
          totalFailed++;
        }
      }

      results.push({
        scenario: scenario.name,
        status: scenarioFailed ? 'FAILED' : 'PASSED',
        steps: stepResults
      });
    }

    const allPassed = !results.some(r => r.status === 'FAILED');

    return {
      status: allPassed ? 'PASSED' : 'FAILED',
      feature: ast.feature,
      totalScenarios: results.length,
      passedScenarios: results.filter(r => r.status === 'PASSED').length,
      failedScenarios: results.filter(r => r.status === 'FAILED').length,
      stepsSummary: { passed: totalPassed, failed: totalFailed, skipped: totalSkipped },
      scenarios: results
    };
  }
}

module.exports = GherkinEngine;