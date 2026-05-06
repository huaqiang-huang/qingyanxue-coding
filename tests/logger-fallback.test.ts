import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function resolveExpectedFallbackUserDataDir(): string {
  const baseDir =
    process.platform === 'darwin'
      ? path.join(os.homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
        : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');

  const preferred = path.join(baseDir, 'qingyanxue-coding');

  if (fs.existsSync(preferred)) {
    return preferred;
  }
  return preferred;
}

const FALLBACK_USER_DATA_DIR = resolveExpectedFallbackUserDataDir();
const FALLBACK_LOGS_DIR = path.join(FALLBACK_USER_DATA_DIR, 'logs');

describe('logger fallback behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses fallback userData path when electron app path API is unavailable', async () => {
    vi.doMock('electron', () => ({
      app: {},
    }));

    const logger = await import('../src/main/utils/logger');

    expect(logger.getLogsDirectory()).toBe(FALLBACK_LOGS_DIR);

    // Trigger lazy init by writing a log entry
    logger.log('init');
    const logFilePath = logger.getLogFilePath();
    expect(logFilePath).toBeTruthy();
    expect(logFilePath?.startsWith(FALLBACK_LOGS_DIR)).toBe(true);
    logger.closeLogFile();
  });

  it('recovers when active log file is removed unexpectedly', async () => {
    vi.doMock('electron', () => ({
      app: {},
    }));

    const logger = await import('../src/main/utils/logger');
    // Trigger lazy init by writing a log entry
    logger.log('init');
    const initialLogPath = logger.getLogFilePath();
    expect(initialLogPath).toBeTruthy();

    if (initialLogPath && fs.existsSync(initialLogPath)) {
      fs.unlinkSync(initialLogPath);
    }

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(() => logger.log('trigger rotate check')).not.toThrow();
    randomSpy.mockRestore();

    const recoveredLogPath = logger.getLogFilePath();
    expect(recoveredLogPath).toBeTruthy();
    expect(recoveredLogPath?.startsWith(FALLBACK_LOGS_DIR)).toBe(true);
    logger.closeLogFile();
  });

  it('serializes Error objects with message details instead of empty object', async () => {
    vi.doMock('electron', () => ({
      app: {},
    }));

    const logger = await import('../src/main/utils/logger');
    // Trigger lazy init by writing a log entry
    logger.log('init');
    const logFilePath = logger.getLogFilePath();
    expect(logFilePath).toBeTruthy();

    logger.logError('[test] expected-error', new Error('boom logger error'));
    logger.closeLogFile();
    await new Promise((resolve) => setTimeout(resolve, 20));

    const content = fs.readFileSync(logFilePath!, 'utf8');
    expect(content).toContain('[test] expected-error');
    expect(content).toContain('boom logger error');
  });

  it('reopens a fresh log file after closeLogFile is called', async () => {
    vi.doMock('electron', () => ({
      app: {},
    }));

    const logger = await import('../src/main/utils/logger');
    // Trigger lazy init by writing a log entry
    logger.log('init');
    const firstLogPath = logger.getLogFilePath();
    expect(firstLogPath).toBeTruthy();

    logger.closeLogFile();
    logger.log('after close should reopen');

    const secondLogPath = logger.getLogFilePath();
    expect(secondLogPath).toBeTruthy();
    expect(secondLogPath).not.toBe(firstLogPath);
  });

  it('swallows broken pipe errors from console output', async () => {
    vi.doMock('electron', () => ({
      app: {},
    }));

    const logger = await import('../src/main/utils/logger');
    const epipeError = Object.assign(new Error('write EPIPE'), { code: 'EPIPE' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
      throw epipeError;
    });

    expect(() => logger.log('stdout closed')).not.toThrow();

    consoleSpy.mockRestore();
    logger.closeLogFile();
  });
});
