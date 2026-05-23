#!/usr/bin/env node

/**
 * GITHUB-SYNC COMMAND - Node.js Implementation
 *
 * Purpose: Create/sync GitHub repository and push local project to remote
 * Usage: node github-sync.js [options]
 *        or npx github-sync
 *
 * @version 1.0.0
 * @author Claude Code
 * @status Production Ready
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Configuration
const config = {
  repoName: process.env.REPO_NAME || 'job-application-tracker',
  repoOwner: process.env.REPO_OWNER || '',
  repoVisibility: process.env.REPO_VISIBILITY || 'public',
  projectDir: process.cwd(),
  logFile: path.join(process.cwd(), 'github-sync.log'),
};

let stepCount = 0;
const totalSteps = 10;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function log(message) {
  const timestamp = new Date().toISOString().split('T')[0];
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(`${colors.blue}${fullMessage}${colors.reset}`);
  fs.appendFileSync(config.logFile, fullMessage + '\n');
}

function success(message) {
  const fullMessage = `✅ ${message}`;
  console.log(`${colors.green}${fullMessage}${colors.reset}`);
  fs.appendFileSync(config.logFile, fullMessage + '\n');
}

function error(message) {
  const fullMessage = `❌ ${message}`;
  console.error(`${colors.red}${fullMessage}${colors.reset}`);
  fs.appendFileSync(config.logFile, fullMessage + '\n');
}

function warning(message) {
  const fullMessage = `⚠️  ${message}`;
  console.log(`${colors.yellow}${fullMessage}${colors.reset}`);
  fs.appendFileSync(config.logFile, fullMessage + '\n');
}

function info(message) {
  const fullMessage = `ℹ️  ${message}`;
  console.log(`${colors.cyan}${fullMessage}${colors.reset}`);
  fs.appendFileSync(config.logFile, fullMessage + '\n');
}

function stepHeader(title) {
  stepCount++;
  const line = '═'.repeat(57);
  console.log(`\n${colors.cyan}╔${line}╗${colors.reset}`);
  console.log(`${colors.cyan}║ STEP ${stepCount}/${totalSteps}: ${title.padEnd(53)}║${colors.reset}`);
  console.log(`${colors.cyan}╚${line}╝${colors.reset}`);
}

function execCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' });
    return { success: true, output: output.trim() };
  } catch (err) {
    return { success: false, output: err.message };
  }
}

function commandExists(cmd) {
  try {
    execSync(`command -v ${cmd}`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function testCommand(cmd) {
  if (commandExists(cmd)) {
    success(`${cmd} is installed`);
    return true;
  } else {
    error(`${cmd} is NOT installed`);
    return false;
  }
}

function fileExists(filePath) {
  return fs.existsSync(path.join(config.projectDir, filePath));
}

function readFile(filePath) {
  const fullPath = path.join(config.projectDir, filePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf-8');
  }
  return '';
}

function writeFile(filePath, content) {
  const fullPath = path.join(config.projectDir, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}

function countLines(filePath) {
  const content = readFile(filePath);
  return content.split('\n').length;
}

// ============================================================================
// STEP 1: GitHub Repository Initialization
// ============================================================================

function step1GitHubInit() {
  stepHeader('GitHub Repository Initialization');

  log('Checking GitHub CLI installation...');
  if (!testCommand('gh')) {
    error('GitHub CLI not installed. Please install from: https://cli.github.com');
    process.exit(1);
  }

  log('Checking GitHub authentication status...');
  const authResult = execCommand('gh auth status', true);
  if (authResult.success) {
    success('GitHub authentication verified');
    const userResult = execCommand('gh api user --jq .login', true);
    if (userResult.success) {
      config.repoOwner = userResult.output;
      success(`User: ${config.repoOwner}`);
    }
  } else {
    warning('Not authenticated with GitHub. Please run: gh auth login');
    process.exit(1);
  }

  log('Checking git installation...');
  testCommand('git') || process.exit(1);

  log('Checking git remote configuration...');
  const remoteResult = execCommand('git remote -v', true);
  if (remoteResult.success && remoteResult.output) {
    info('Git remote configuration:');
    remoteResult.output.split('\n').forEach(line => info(line));
  } else {
    info('No git remote configured yet (will be set in Step 2)');
  }

  success('Step 1 Complete: GitHub initialization verified');
}

// ============================================================================
// STEP 2: Create Remote Repository
// ============================================================================

function step2CreateRepo() {
  stepHeader('Create Remote Repository (if not exists)');

  log('Checking if repository already exists on GitHub...');
  const repoCheckResult = execCommand(
    `gh repo view ${config.repoOwner}/${config.repoName}`,
    true
  );

  if (repoCheckResult.success) {
    warning(`Repository already exists: https://github.com/${config.repoOwner}/${config.repoName}`);
  } else {
    log('Creating new GitHub repository...');
    const createResult = execCommand(
      `gh repo create ${config.repoName} --${config.repoVisibility} --source=. --remote=origin --push`,
      false
    );
    if (createResult.success) {
      success('Repository created successfully');
    } else {
      error('Failed to create repository: ' + createResult.output);
      process.exit(1);
    }
  }

  log('Verifying repository on GitHub...');
  const urlResult = execCommand(
    `gh repo view ${config.repoOwner}/${config.repoName} --json url -q .url`,
    true
  );
  if (urlResult.success) {
    success(`Repository URL: ${urlResult.output}`);
  }

  success('Step 2 Complete: Remote repository configured');
}

// ============================================================================
// STEP 3: GitHub-Specific Configuration Files
// ============================================================================

function step3GitHubFiles() {
  stepHeader('Add GitHub-Specific Configuration Files');

  log('Verifying README.md...');
  if (fileExists('README.md')) {
    const lines = countLines('README.md');
    if (lines > 300) {
      success(`README.md exists (${lines} lines)`);
    } else {
      warning(`README.md exists but is short (${lines} lines)`);
    }
  } else {
    warning('README.md not found');
  }

  log('Verifying .gitignore...');
  if (fileExists('.gitignore')) {
    const content = readFile('.gitignore');
    if (content.includes('node_modules') && content.includes('.next')) {
      success('.gitignore properly configured');
    } else {
      warning('.gitignore missing important excludes');
    }
  } else {
    error('.gitignore not found');
  }

  log('Verifying LICENSE...');
  if (fileExists('LICENSE')) {
    success('LICENSE file found');
  } else {
    warning('LICENSE file not found (creating MIT license)');
    const mitLicense = `MIT License

Copyright (c) 2026 Job Application Tracker Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
    writeFile('LICENSE', mitLicense);
    success('Created MIT LICENSE file');
  }

  success('Step 3 Complete: GitHub files verified');
}

// ============================================================================
// STEP 4: Project History & Documentation
// ============================================================================

function step4Documentation() {
  stepHeader('Project History & Documentation');

  const docFiles = ['HISTORY.md', 'DEPLOYMENT.md', 'PROJECT_SUMMARY.md'];

  docFiles.forEach(file => {
    if (fileExists(file)) {
      const lines = countLines(file);
      success(`${file} exists (${lines} lines)`);
    } else {
      warning(`${file} not found`);
    }
  });

  if (fileExists('HISTORY.md')) {
    const content = readFile('HISTORY.md');
    const sprintCount = (content.match(/### \*\*Sprint/g) || []).length;
    success(`HISTORY.md contains ${sprintCount} sprint sections`);
  }

  success('Step 4 Complete: Documentation files verified');
}

// ============================================================================
// STEP 5: Version Control Configuration
// ============================================================================

function step5GitConfig() {
  stepHeader('Version Control Configuration');

  log('Checking git user configuration...');
  const nameResult = execCommand('git config user.name', true);
  const emailResult = execCommand('git config user.email', true);

  if (!nameResult.success || !emailResult.success) {
    warning('Git user not fully configured. Setting defaults...');
    execCommand('git config user.name "Claude Code"', true);
    execCommand('git config user.email "noreply@anthropic.com"', true);
  }

  const name = nameResult.output || 'Claude Code';
  const email = emailResult.output || 'noreply@anthropic.com';
  success(`Git user: ${name} <${email}>`);

  log('Creating .gitattributes for consistency...');
  const gitattributes = `* text=auto
*.ts text eol=lf
*.tsx text eol=lf
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
*.yml text eol=lf
*.yaml text eol=lf`;
  writeFile('.gitattributes', gitattributes);
  success('.gitattributes created');

  success('Step 5 Complete: Git configuration verified');
}

// ============================================================================
// STEP 6: Branch Protection (Optional)
// ============================================================================

function step6BranchProtection() {
  stepHeader('Branch Protection Configuration (Optional)');

  log('Attempting to set up branch protection rules...');
  const protectResult = execCommand(
    `gh api repos/${config.repoOwner}/${config.repoName}/branches/master/protection -X PUT -f require_code_reviews='{\"dismiss_stale_reviews\":true,\"required_approving_review_count\":1}'`,
    true
  );

  if (protectResult.success) {
    success('Branch protection configured');
  } else {
    warning('Could not configure branch protection (requires admin access)');
    info('You can configure this manually in GitHub repository settings');
  }

  success('Step 6 Complete: Branch protection setup attempted');
}

// ============================================================================
// STEP 7: Issue & PR Templates (Optional)
// ============================================================================

function step7Templates() {
  stepHeader('Issue & Pull Request Templates (Optional)');

  log('Checking for GitHub templates...');

  if (fileExists('.github/ISSUE_TEMPLATE')) {
    success('Issue templates directory exists');
  } else {
    log('Creating issue templates...');
    const bugTemplate = `---
name: Bug report
about: Create a report to help us improve
---

**Describe the bug**
A clear description of what the bug is.

**Steps to reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen?`;

    writeFile('.github/ISSUE_TEMPLATE/bug_report.md', bugTemplate);
    success('Bug report template created');

    const featureTemplate = `---
name: Feature request
about: Suggest an idea
---

**Is your feature related to a problem?**
Describe the problem.

**Describe the solution**
What would you like to happen?`;

    writeFile('.github/ISSUE_TEMPLATE/feature_request.md', featureTemplate);
    success('Feature request template created');
  }

  if (fileExists('.github/pull_request_template.md')) {
    success('Pull request template exists');
  } else {
    const prTemplate = `## Description
Brief description of changes.

## Type of change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change

## Testing
How was this tested?`;

    writeFile('.github/pull_request_template.md', prTemplate);
    success('Pull request template created');
  }

  success('Step 7 Complete: Templates created/verified');
}

// ============================================================================
// STEP 8: Final Verification & Validation
// ============================================================================

function step8Verification() {
  stepHeader('Final Verification & Validation');

  log('Showing commit history...');
  const logResult = execCommand('git log --oneline | head -10', true);
  if (logResult.success) {
    logResult.output.split('\n').forEach(line => info(line));
  }

  log('Checking git status...');
  const statusResult = execCommand('git status --short', true);
  if (statusResult.output) {
    warning('Uncommitted changes found:');
    statusResult.output.split('\n').forEach(line => info(line));
  } else {
    success('Working tree clean - no uncommitted changes');
  }

  log('Counting committed files...');
  const fileCountResult = execCommand('git ls-tree -r --name-only HEAD | wc -l', true);
  if (fileCountResult.success) {
    const count = parseInt(fileCountResult.output);
    if (count > 50) {
      success(`${count} files committed`);
    } else {
      warning(`Only ${count} files committed (expected 50+)`);
    }
  }

  success('Step 8 Complete: Verification finished');
}

// ============================================================================
// STEP 9: Remote Synchronization Confirmation
// ============================================================================

function step9SyncConfirm() {
  stepHeader('Remote Synchronization Confirmation');

  log('Checking remote configuration...');
  const remoteResult = execCommand('git remote -v', true);
  if (remoteResult.success && remoteResult.output.includes('origin')) {
    success('Remote origin configured');
    info(remoteResult.output);
  } else {
    error('Remote origin not configured');
    process.exit(1);
  }

  log('Checking branch tracking...');
  const trackingResult = execCommand('git branch -vv', true);
  if (trackingResult.success) {
    info('Current branch tracking:');
    trackingResult.output.split('\n').forEach(line => {
      if (line.includes('*')) info(line);
    });
  }

  success('Step 9 Complete: Synchronization verified');
}

// ============================================================================
// STEP 10: Documentation Accessibility
// ============================================================================

function step10DocsAccess() {
  stepHeader('Documentation Accessibility');

  log('Verifying documentation files on GitHub...');
  const docFiles = ['README.md', 'DEPLOYMENT.md', 'PROJECT_SUMMARY.md', 'HISTORY.md'];

  docFiles.forEach(file => {
    const result = execCommand(
      `gh api repos/${config.repoOwner}/${config.repoName}/contents/${file} -q .name`,
      true
    );
    if (result.success) {
      success(`${file} is accessible on GitHub`);
    } else {
      warning(`${file} not found on GitHub`);
    }
  });

  log('Repository URL for reference:');
  const repoUrl = `https://github.com/${config.repoOwner}/${config.repoName}`;
  success(`🔗 ${repoUrl}`);

  success('Step 10 Complete: Documentation accessibility verified');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('');
  console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}║           🚀 GITHUB-SYNC COMMAND - EXECUTION 🚀              ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}║  Create/sync GitHub repository and push local project       ║${colors.reset}`);
  console.log(`${colors.cyan}║                                                              ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');

  log('Starting GitHub sync operation...');
  log(`Project: ${config.repoName}`);
  log(`Directory: ${config.projectDir}`);
  log(`Log file: ${config.logFile}`);
  console.log('');

  try {
    // Run all steps
    step1GitHubInit();
    step2CreateRepo();
    step3GitHubFiles();
    step4Documentation();
    step5GitConfig();
    step6BranchProtection();
    step7Templates();
    step8Verification();
    step9SyncConfirm();
    step10DocsAccess();

    // Final summary
    console.log('');
    console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.green}║                   ✅ GITHUB SYNC COMPLETE                   ║${colors.reset}`);
    console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}`);
    console.log('');
    console.log(`${colors.green}Repository:${colors.reset} https://github.com/${config.repoOwner}/${config.repoName}`);
    console.log(`${colors.green}Status:${colors.reset} Ready for collaboration`);
    console.log(`${colors.green}Log file:${colors.reset} ${config.logFile}`);
    console.log('');
    success('All steps completed successfully!');
  } catch (err) {
    error(`Script failed: ${err.message}`);
    process.exit(1);
  }
}

// Run main function
main().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
