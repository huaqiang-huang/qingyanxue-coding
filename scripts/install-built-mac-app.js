#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const packageJson = require(path.join(projectRoot, 'package.json'));

const APP_NAME = '清砚雪Coding';
const APP_BUNDLE = `${APP_NAME}.app`;
const RELEASE_DIR = path.join(projectRoot, 'release');
const INSTALL_PATH = path.join('/Applications', APP_BUNDLE);
const LSREGISTER_PATH =
  '/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister';

function runOptional(command, args) {
  try {
    execFileSync(command, args, { stdio: 'ignore' });
  } catch (_error) {
    // Best effort only.
  }
}

function removePath(targetPath) {
  if (fs.existsSync(targetPath)) {
    fs.rmSync(targetPath, { recursive: true, force: true });
  }
}

function stopRunningApp() {
  spawnSync('pkill', ['-f', APP_NAME], { stdio: 'ignore' });
}

function findBuiltApps() {
  if (!fs.existsSync(RELEASE_DIR)) {
    return [];
  }

  return fs
    .readdirSync(RELEASE_DIR)
    .filter((entry) => entry.startsWith('mac-'))
    .map((entry) => path.join(RELEASE_DIR, entry, APP_BUNDLE))
    .filter((candidate) => fs.existsSync(candidate))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);
}

const builtApps = findBuiltApps();

if (builtApps.length === 0) {
  console.error(`[install:mac-local] No built app found under ${RELEASE_DIR}`);
  process.exit(1);
}

const sourceApp = builtApps[0];

console.log(`[install:mac-local] Installing ${APP_NAME} ${packageJson.version}`);
console.log(`[install:mac-local] Source: ${sourceApp}`);
console.log(`[install:mac-local] Target: ${INSTALL_PATH}`);

stopRunningApp();

for (const duplicateApp of builtApps) {
  runOptional(LSREGISTER_PATH, ['-u', duplicateApp]);
}

removePath(INSTALL_PATH);
fs.cpSync(sourceApp, INSTALL_PATH, { recursive: true });

runOptional('xattr', ['-rd', 'com.apple.quarantine', INSTALL_PATH]);
runOptional(LSREGISTER_PATH, ['-f', INSTALL_PATH]);

for (const duplicateApp of builtApps) {
  removePath(duplicateApp);
}

console.log('[install:mac-local] Installed successfully and cleaned duplicate build app bundles.');
