import { describe, expect, it } from 'vitest';
import { ToolExecutor } from '../src/main/tools/tool-executor';
import { SandboxToolExecutor } from '../src/main/tools/sandbox-tool-executor';

type MockPathResolver = {
  getMounts: () => Array<{ real: string; virtual: string }>;
  resolve: (sessionId: string, virtualPath: string) => string | null;
};
type ToolExecutorPathInternals = ToolExecutor & {
  resolveWorkspacePath: (sessionId: string, inputPath: string) => string;
};
type SandboxToolExecutorPathInternals = SandboxToolExecutor & {
  resolveWorkspacePath: (sessionId: string, inputPath: string) => string;
};

const mockPathResolver: MockPathResolver = {
  getMounts: () => [{ real: '/tmp/project', virtual: '/workspace' }],
  resolve: () => null,
};

describe('tool executors treat UNC paths as absolute', () => {
  it('does not resolve UNC paths relative to the mounted workspace in ToolExecutor', () => {
    const executor = new ToolExecutor(mockPathResolver) as unknown as ToolExecutorPathInternals;
    expect(executor.resolveWorkspacePath('session-1', '\\\\server\\share\\report.txt')).toBe(
      '\\\\server\\share\\report.txt'
    );
  });

  it('does not resolve UNC paths relative to the mounted workspace in SandboxToolExecutor', () => {
    const sandboxAdapterStub = {} as object;
    const executor = new SandboxToolExecutor(
      mockPathResolver,
      sandboxAdapterStub
    ) as unknown as SandboxToolExecutorPathInternals;
    expect(executor.resolveWorkspacePath('session-1', '\\\\server\\share\\report.txt')).toBe(
      '\\\\server\\share\\report.txt'
    );
  });
});
