/**
 * Test Reporter with Rich ANSI Output and Tier Organization
 */

export class TestReporter {
  constructor(suiteName = 'E2E Test Suite') {
    this.suiteName = suiteName;
    this.results = [];
    this.currentTier = null;
    this.startTime = Date.now();
  }

  static colors = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m',
  };

  tier(tierNumber, tierTitle) {
    this.currentTier = { number: tierNumber, title: tierTitle };
    const { bold, cyan, reset, gray } = TestReporter.colors;
    console.log(`\n${bold}${cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
    console.log(`${bold}${cyan}  TIER ${tierNumber}: ${tierTitle.toUpperCase()}${reset}`);
    console.log(`${gray}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${reset}`);
  }

  pass(name, details = '') {
    const { green, bold, reset, gray } = TestReporter.colors;
    const item = {
      tier: this.currentTier ? this.currentTier.number : 0,
      name,
      status: 'PASSED',
      details,
    };
    this.results.push(item);
    const detailStr = details ? ` ${gray}(${details})${reset}` : '';
    console.log(`  ${green}${bold}✔ PASS${reset}  ${name}${detailStr}`);
  }

  fail(name, error, details = '') {
    const { red, bold, reset, gray } = TestReporter.colors;
    const item = {
      tier: this.currentTier ? this.currentTier.number : 0,
      name,
      status: 'FAILED',
      error: error?.message || String(error),
      details,
    };
    this.results.push(item);
    console.log(`  ${red}${bold}✘ FAIL${reset}  ${name}`);
    if (details) {
      console.log(`         ${gray}${details}${reset}`);
    }
    if (error) {
      console.log(`         ${red}Error: ${error.message || error}${reset}`);
      if (error.stack && process.env.DEBUG) {
        console.log(`         ${gray}${error.stack}${reset}`);
      }
    }
  }

  skip(name, reason = '') {
    const { yellow, bold, reset, gray } = TestReporter.colors;
    const item = {
      tier: this.currentTier ? this.currentTier.number : 0,
      name,
      status: 'SKIPPED',
      details: reason,
    };
    this.results.push(item);
    const reasonStr = reason ? ` ${gray}(${reason})${reset}` : '';
    console.log(`  ${yellow}${bold}↷ SKIP${reset}  ${name}${reasonStr}`);
  }

  info(message) {
    const { gray, reset } = TestReporter.colors;
    console.log(`    ${gray}ℹ ${message}${reset}`);
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const total = this.results.length;
    const passed = this.results.filter((r) => r.status === 'PASSED').length;
    const failed = this.results.filter((r) => r.status === 'FAILED').length;
    const skipped = this.results.filter((r) => r.status === 'SKIPPED').length;

    const { bold, green, red, yellow, reset, cyan } = TestReporter.colors;

    console.log(`\n${bold}${cyan}=====================================================================${reset}`);
    console.log(`${bold}  ${this.suiteName} — Execution Summary${reset}`);
    console.log(`${cyan}=====================================================================${reset}`);
    console.log(`  Total Tests : ${bold}${total}${reset}`);
    console.log(`  Passed      : ${green}${bold}${passed}${reset}`);
    console.log(`  Failed      : ${failed > 0 ? red : green}${bold}${failed}${reset}`);
    console.log(`  Skipped     : ${yellow}${bold}${skipped}${reset}`);
    console.log(`  Duration    : ${duration}s`);

    // Tier breakdown
    console.log(`\n  Tier Breakdown:`);
    for (let t = 1; t <= 4; t++) {
      const tierTests = this.results.filter((r) => r.tier === t);
      if (tierTests.length > 0) {
        const tPass = tierTests.filter((r) => r.status === 'PASSED').length;
        const tFail = tierTests.filter((r) => r.status === 'FAILED').length;
        const tSkip = tierTests.filter((r) => r.status === 'SKIPPED').length;
        const statusColor = tFail > 0 ? red : green;
        console.log(
          `    Tier ${t}: ${statusColor}${tPass}/${tierTests.length} passed${reset}` +
            (tFail > 0 ? ` (${tFail} failed)` : '') +
            (tSkip > 0 ? ` (${tSkip} skipped)` : '')
        );
      }
    }

    if (failed > 0) {
      console.log(`\n${red}${bold}  FAILED TESTS:${reset}`);
      this.results
        .filter((r) => r.status === 'FAILED')
        .forEach((r, idx) => {
          console.log(`    ${idx + 1}. [Tier ${r.tier}] ${r.name}`);
          console.log(`       ${red}↳ ${r.error}${reset}`);
        });
    }

    console.log(`${cyan}=====================================================================${reset}\n`);

    return {
      total,
      passed,
      failed,
      skipped,
      durationSeconds: parseFloat(duration),
      isSuccess: failed === 0,
    };
  }
}

export default TestReporter;
