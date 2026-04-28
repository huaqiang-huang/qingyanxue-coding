import { app } from 'electron';
import os from 'node:os';
import fs from 'node:fs';
import { resolve } from 'path';

const APP_DATA_DIR_NAME = 'qingyanxue-coding';
const LEGACY_APP_DATA_DIR_NAME = 'open-cowork';

function readCliArg(name: string): string | undefined {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length).trim();
  return value ? value : undefined;
}

export function getOpenCoworkUserDataOverride(): string | undefined {
  const raw =
    process.env.QINGYANXUE_CODING_USER_DATA_DIR?.trim() ||
    process.env.OPEN_COWORK_USER_DATA_DIR?.trim() ||
    readCliArg('--qingyanxue-coding-user-data-dir') ||
    readCliArg('--qingyanxue-coding-userdata-dir') ||
    readCliArg('--open-cowork-user-data-dir') ||
    readCliArg('--open-cowork-userdata-dir');
  return raw ? resolve(raw) : undefined;
}

export function getOpenCoworkWorkdirOverride(): string | undefined {
  const raw =
    process.env.QINGYANXUE_CODING_WORKDIR ||
    process.env.QINGYANXUE_CODING_DEFAULT_WORKDIR ||
    process.env.COWORK_WORKDIR ||
    process.env.WORKDIR ||
    process.env.DEFAULT_CWD ||
    readCliArg('--qingyanxue-coding-workdir') ||
    readCliArg('--qingyanxue-coding-default-workdir') ||
    readCliArg('--open-cowork-workdir') ||
    readCliArg('--open-cowork-default-workdir');
  return raw?.trim() ? resolve(raw.trim()) : undefined;
}

function resolveAppDataPath(baseDir: string | undefined, dirName: string): string | undefined {
  if (!baseDir) return undefined;
  const candidate = resolve(baseDir, dirName);
  return fs.existsSync(candidate) ? candidate : undefined;
}

export function getOpenCoworkAppDataDir(): string {
  const override = getOpenCoworkUserDataOverride();
  if (override) {
    return override;
  }

  try {
    const userDataPath = app.getPath('userData');
    if (userDataPath?.trim()) {
      return resolve(userDataPath);
    }
  } catch {
    // Fall through to legacy-compatible default.
  }

  if (process.platform === 'darwin') {
    const base = resolve(os.homedir(), 'Library/Application Support');
    return (
      resolveAppDataPath(base, APP_DATA_DIR_NAME) ||
      resolveAppDataPath(base, LEGACY_APP_DATA_DIR_NAME) ||
      resolve(base, APP_DATA_DIR_NAME)
    );
  }
  if (process.platform === 'win32') {
    const base = process.env.APPDATA || resolve(os.homedir(), 'AppData/Roaming');
    return resolveAppDataPath(base, APP_DATA_DIR_NAME) || resolveAppDataPath(base, LEGACY_APP_DATA_DIR_NAME) || resolve(base, APP_DATA_DIR_NAME);
  }
  const base = process.env.XDG_CONFIG_HOME || resolve(os.homedir(), '.config');
  return resolveAppDataPath(base, APP_DATA_DIR_NAME) || resolveAppDataPath(base, LEGACY_APP_DATA_DIR_NAME) || resolve(base, APP_DATA_DIR_NAME);
}
