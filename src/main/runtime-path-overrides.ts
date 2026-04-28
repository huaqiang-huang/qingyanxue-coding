import { app } from 'electron';
import os from 'node:os';
import { resolve } from 'path';

function readCliArg(name: string): string | undefined {
  const prefix = `${name}=`;
  const value = process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length).trim();
  return value ? value : undefined;
}

export function getOpenCoworkUserDataOverride(): string | undefined {
  const raw =
    process.env.OPEN_COWORK_USER_DATA_DIR?.trim() ||
    readCliArg('--open-cowork-user-data-dir') ||
    readCliArg('--open-cowork-userdata-dir');
  return raw ? resolve(raw) : undefined;
}

export function getOpenCoworkWorkdirOverride(): string | undefined {
  const raw =
    process.env.COWORK_WORKDIR ||
    process.env.WORKDIR ||
    process.env.DEFAULT_CWD ||
    readCliArg('--open-cowork-workdir') ||
    readCliArg('--open-cowork-default-workdir');
  return raw?.trim() ? resolve(raw.trim()) : undefined;
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
    return resolve(os.homedir(), 'Library/Application Support/open-cowork');
  }
  if (process.platform === 'win32') {
    return resolve(process.env.APPDATA || resolve(os.homedir(), 'AppData/Roaming'), 'open-cowork');
  }
  return resolve(process.env.XDG_CONFIG_HOME || resolve(os.homedir(), '.config'), 'open-cowork');
}
