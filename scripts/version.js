#!/usr/bin/env node

/**
 * Advanced versioning script for Risqe Backend
 * Handles automatic version bumping and git operations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function getNextVersion(type) {
  const currentVersion = getCurrentVersion();
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function runCommand(command, description) {
  try {
    log(`🔄 ${description}...`, 'blue');
    execSync(command, { stdio: 'inherit' });
    log(`✅ ${description} completed`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'red');
    return false;
  }
}

function checkWorkingDirectory() {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    log('❌ Working directory is not clean. Please commit or stash changes first.', 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  if (!['major', 'minor', 'patch'].includes(versionType)) {
    log('❌ Invalid version type. Use: major, minor, or patch', 'red');
    process.exit(1);
  }
  
  log('🚀 Risqe Backend Versioning Script', 'bright');
  log('=====================================', 'bright');
  
  const currentVersion = getCurrentVersion();
  const nextVersion = getNextVersion(versionType);
  
  log(`📦 Current version: ${currentVersion}`, 'cyan');
  log(`📈 Next version: ${nextVersion}`, 'cyan');
  log(`🎯 Version type: ${versionType}`, 'cyan');
  
  // Check if working directory is clean
  checkWorkingDirectory();
  
  // Run tests
  if (!runCommand('npm test', 'Running tests')) {
    process.exit(1);
  }
  
  // Build project
  if (!runCommand('npm run build', 'Building project')) {
    process.exit(1);
  }
  
  // Bump version
  if (!runCommand(`npm version ${versionType} --no-git-tag-version`, 'Bumping version')) {
    process.exit(1);
  }
  
  // Commit version bump
  if (!runCommand(`git add package.json && git commit -m "chore: bump version to ${nextVersion}"`, 'Committing version bump')) {
    process.exit(1);
  }
  
  // Create git tag
  if (!runCommand(`git tag v${nextVersion}`, 'Creating git tag')) {
    process.exit(1);
  }
  
  // Push changes and tags
  if (!runCommand('git push && git push --tags', 'Pushing changes and tags')) {
    process.exit(1);
  }
  
  log('🎉 Version bump completed successfully!', 'green');
  log(`📦 New version: ${nextVersion}`, 'bright');
  log(`🏷️  Tag created: v${nextVersion}`, 'bright');
}

if (require.main === module) {
  main();
}

module.exports = { getCurrentVersion, getNextVersion };
