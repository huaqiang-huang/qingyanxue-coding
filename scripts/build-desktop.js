#!/usr/bin/env node

'use strict';

const { spawnSync } = require('child_process');

const platform = process.platform;
const extraArgs = process.argv.slice(2);

function run(command, args) {
  const display = [command, ...args].join(' ');
  console.log(`\n[build:desktop] ${display}\n`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env,
  });

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }

  if (result.error) {
    throw result.error;
  }
}

const commonSteps = [
  ['npm', ['run', 'download:node']],
  ['npm', ['run', 'build:mcp']],
  ['npx', ['tsc']],
  ['npx', ['vite', 'build']],
  ['node', ['scripts/pre-build-check.js']],
];

const platformSteps = {
  darwin: [
    ['npm', ['run', 'prepare:gui-tools']],
    ['npm', ['run', 'prepare:python:all']],
    ['npm', ['run', 'build:lima-agent']],
  ],
  win32: [
    ['npm', ['run', 'build:wsl-agent']],
  ],
  linux: [
    ['npm', ['run', 'prepare:python']],
  ],
};

const defaultPlatformTargets = {
  darwin: ['--mac', 'dir'],
  win32: ['--win', 'nsis'],
  linux: ['--linux', 'AppImage'],
};

const steps = platformSteps[platform];
if (!steps) {
  console.error(`[build:desktop] Unsupported platform: ${platform}`);
  process.exit(1);
}

for (const [command, args] of [...steps, ...commonSteps]) {
  run(command, args);
}

const builderArgs =
  extraArgs.length > 0 ? extraArgs : defaultPlatformTargets[platform];

run('npx', ['electron-builder', ...builderArgs]);
