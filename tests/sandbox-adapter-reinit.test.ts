import { describe, expect, it, vi } from 'vitest';
import { SandboxAdapter } from '../src/main/sandbox/sandbox-adapter';

type SandboxAdapterTestInternals = SandboxAdapter & {
  initializeNative: (config: { workspacePath: string }) => Promise<void>;
  executor: { shutdown: () => Promise<void> };
  state: {
    mode: string;
    workspacePath: string;
  };
};

vi.mock('electron', () => {
  const electron = {
    app: {
      getPath: () => '/tmp/qingyanxue-coding-test',
      getName: () => 'qingyanxue-coding-test',
      getVersion: () => '0.0.0-test',
    },
    dialog: {
      showMessageBox: vi.fn(),
    },
    BrowserWindow: class {},
    ipcMain: {
      on: vi.fn(),
      handle: vi.fn(),
    },
    shell: {
      openPath: vi.fn(),
    },
  };

  return {
    ...electron,
    default: electron,
  };
});

describe('SandboxAdapter reinitialization', () => {
  it('reinitializes when the workspace changes', async () => {
    const adapter = new SandboxAdapter();
    const internals = adapter as unknown as SandboxAdapterTestInternals;
    const shutdownMock = vi.fn().mockResolvedValue(undefined);

    vi.spyOn(internals, 'initializeNative').mockImplementation(
      async (config: { workspacePath: string }) => {
        internals.executor = { shutdown: shutdownMock };
        internals.state.mode = 'native';
        internals.state.workspacePath = config.workspacePath;
      }
    );

    await adapter.initialize({ workspacePath: '/tmp/workspace-a', forceNative: true });
    expect(adapter.workspacePath).toBe('/tmp/workspace-a');

    await adapter.initialize({ workspacePath: '/tmp/workspace-b', forceNative: true });
    expect(adapter.workspacePath).toBe('/tmp/workspace-b');
    expect(shutdownMock).toHaveBeenCalledTimes(1);
  });
});
