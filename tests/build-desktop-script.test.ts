import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const scriptPath = path.resolve(process.cwd(), 'scripts/build-desktop.js');

describe('build-desktop helper', () => {
  it('routes default electron-builder targets by host platform', () => {
    const source = fs.readFileSync(scriptPath, 'utf8');

    expect(source).toContain("darwin: ['--mac', 'dir']");
    expect(source).toContain("win32: ['--win', 'nsis']");
    expect(source).toContain("linux: ['--linux', 'AppImage']");
  });

  it('runs platform-specific preparation before the shared desktop build pipeline', () => {
    const source = fs.readFileSync(scriptPath, 'utf8');

    expect(source).toContain("['npm', ['run', 'prepare:gui-tools']]");
    expect(source).toContain("['npm', ['run', 'prepare:python:all']]");
    expect(source).toContain("['npm', ['run', 'build:lima-agent']]");
    expect(source).toContain("['npm', ['run', 'build:wsl-agent']]");
    expect(source).toContain("['npm', ['run', 'prepare:python']]");
    expect(source).toContain("['node', ['scripts/pre-build-check.js']]");
  });
});

