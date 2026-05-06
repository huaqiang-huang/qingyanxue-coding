import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const nativeExecutorPath = path.resolve(process.cwd(), 'src/main/sandbox/native-executor.ts');
const wslAgentPath = path.resolve(process.cwd(), 'src/main/sandbox/wsl-agent/index.ts');
const limaAgentPath = path.resolve(process.cwd(), 'src/main/sandbox/lima-agent/index.ts');

describe('Sandbox executor containment wiring', () => {
  it('treats workspace as default cwd instead of a hard path boundary', () => {
    const nativeSource = fs.readFileSync(nativeExecutorPath, 'utf8');
    const wslSource = fs.readFileSync(wslAgentPath, 'utf8');
    const limaSource = fs.readFileSync(limaAgentPath, 'utf8');

    expect(nativeSource).not.toContain(
      "import { isPathWithinRoot } from '../tools/path-containment';"
    );
    expect(nativeSource).toContain('Working directory not found');
    expect(nativeSource).toContain('Normalize a host path while still resolving symlinks');

    expect(wslSource).not.toContain("import { isPathWithinRoot } from './path-containment';");
    expect(wslSource).toContain('Working directory not found');
    expect(wslSource).toContain('Normalize a host path while still resolving symlinks');

    expect(limaSource).not.toContain("import { isPathWithinRoot } from './path-containment';");
    expect(limaSource).toContain('Working directory not found');
    expect(limaSource).toContain('Normalize a host path while still resolving symlinks');
  });
});
