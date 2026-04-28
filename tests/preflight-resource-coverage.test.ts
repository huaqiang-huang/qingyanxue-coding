import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('preflight resource coverage', () => {
  it('checks platform-specific bundled node paths and sandbox agents', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/main/preflight.ts'), 'utf8');

    expect(source).toContain("check('node/bin/node', 'Bundled Node.js', 'critical');");
    expect(source).toContain("check('node/node.exe', 'Bundled Node.js', 'critical');");
    expect(source).toContain("check('lima-agent/index.js', 'Lima Sandbox Agent', 'warning');");
    expect(source).toContain("check('wsl-agent/index.js', 'WSL Sandbox Agent', 'warning');");
  });

  it('is enforced during smoke-test startup', () => {
    const source = fs.readFileSync(path.resolve(process.cwd(), 'src/main/index.ts'), 'utf8');

    expect(source).toContain('const preflightIssues = runPreflight();');
    expect(source).toContain("criticalIssues.length > 0");
    expect(source).toContain("criticalPreflightIssues.length > 0");
  });
});
