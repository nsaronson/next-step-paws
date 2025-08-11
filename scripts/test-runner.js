#!/usr/bin/env node

/**
 * Comprehensive test runner script
 * Runs all tests, checks coverage, and generates reports
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(step, description) {
  log(`\n${colors.bright}${colors.blue}[${step}] ${description}${colors.reset}`);
}

function logSuccess(message) {
  log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logError(message) {
  log(`${colors.red}❌ ${message}${colors.reset}`);
}

function logWarning(message) {
  log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

function runCommand(command, description, options = {}) {
  try {
    logStep('RUNNING', description);
    const result = execSync(command, {
      stdio: 'inherit',
      encoding: 'utf8',
      ...options
    });
    logSuccess(`${description} completed successfully`);
    return result;
  } catch (error) {
    logError(`${description} failed`);
    if (options.continueOnError) {
      logWarning('Continuing despite error...');
      return null;
    }
    process.exit(1);
  }
}

function checkCoverage() {
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    logWarning('Coverage summary not found');
    return;
  }

  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    log('\n' + colors.bright + colors.cyan + '📊 COVERAGE SUMMARY' + colors.reset);
    log('═'.repeat(50));
    
    const metrics = [
      { name: 'Lines', data: total.lines },
      { name: 'Functions', data: total.functions },
      { name: 'Branches', data: total.branches },
      { name: 'Statements', data: total.statements }
    ];

    let allPassed = true;
    const threshold = 70;

    metrics.forEach(({ name, data }) => {
      const percentage = data.pct;
      const color = percentage >= threshold ? colors.green : colors.red;
      const status = percentage >= threshold ? '✅' : '❌';
      
      log(`${status} ${name.padEnd(12)}: ${color}${percentage}%${colors.reset} (${data.covered}/${data.total})`);
      
      if (percentage < threshold) {
        allPassed = false;
      }
    });

    log('═'.repeat(50));
    
    if (allPassed) {
      logSuccess('All coverage thresholds met!');
    } else {
      logError(`Some coverage thresholds below ${threshold}%`);
    }

    return allPassed;
  } catch (error) {
    logError('Failed to read coverage summary');
    return false;
  }
}

function generateTestReport() {
  const reportDir = path.join(process.cwd(), 'test-reports');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    environment: {
      node: process.version,
      npm: execSync('npm --version', { encoding: 'utf8' }).trim(),
      os: process.platform
    },
    testResults: {
      coverageReportPath: './coverage/lcov-report/index.html',
      junitReportPath: './junit.xml'
    }
  };

  fs.writeFileSync(
    path.join(reportDir, 'test-report.json'),
    JSON.stringify(report, null, 2)
  );

  logSuccess('Test report generated in test-reports/');
}

function main() {
  const args = process.argv.slice(2);
  const isCI = process.env.CI === 'true';
  const watchMode = args.includes('--watch');
  const skipLint = args.includes('--skip-lint');
  const skipTypecheck = args.includes('--skip-typecheck');

  log(colors.bright + colors.magenta + '🧪 NEXT STEP PAWS - TEST RUNNER' + colors.reset);
  log('═'.repeat(50));

  // Install dependencies if needed
  if (!fs.existsSync('node_modules')) {
    runCommand('npm ci', 'Installing dependencies');
  }

  // Run linting
  if (!skipLint) {
    runCommand('npm run lint', 'Running ESLint', { continueOnError: !isCI });
  }

  // Run type checking
  if (!skipTypecheck) {
    runCommand('npm run typecheck', 'Running TypeScript type check', { continueOnError: !isCI });
  }

  // Run tests
  if (watchMode) {
    runCommand('npm run test:watch', 'Running tests in watch mode');
  } else {
    runCommand('npm run test:ci', 'Running tests with coverage');
    
    // Check coverage thresholds
    const coveragePassed = checkCoverage();
    
    // Generate test report
    generateTestReport();
    
    if (isCI && !coveragePassed) {
      logError('Coverage thresholds not met in CI environment');
      process.exit(1);
    }
  }

  if (!watchMode) {
    log('\n' + colors.bright + colors.green + '🎉 ALL TESTS COMPLETED SUCCESSFULLY!' + colors.reset);
    log('═'.repeat(50));
    log(`${colors.cyan}📊 View coverage report: ${colors.reset}coverage/lcov-report/index.html`);
    log(`${colors.cyan}📋 View test report: ${colors.reset}test-reports/test-report.json`);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = { main, checkCoverage, generateTestReport };
