import { describe, expect, it } from 'vitest';
import { normalizeFilesystemErrorMessage } from '../src/main/tools/filesystem-error-utils';

describe('normalizeFilesystemErrorMessage', () => {
  it('explains asar ENOENT as packaged-path issue instead of permissions', () => {
    const message = normalizeFilesystemErrorMessage(
      'read',
      '/Applications/清砚雪Coding.app/Contents/Resources/app.asar/README.md',
      new Error('ENOENT: no such file or directory')
    );
    expect(message).toContain('packaged .asar archive');
    expect(message).toContain('not a filesystem permission restriction');
  });

  it('explains ordinary missing files as not-found rather than permissions', () => {
    const message = normalizeFilesystemErrorMessage(
      'read',
      '/tmp/missing.txt',
      new Error('File not found: /tmp/missing.txt')
    );
    expect(message).toContain('/tmp/missing.txt');
    expect(message).toContain('missing-path problem');
  });

  it('explains missing working directory clearly', () => {
    const message = normalizeFilesystemErrorMessage(
      'command',
      '/tmp/does-not-exist',
      new Error('Working directory not found: /tmp/does-not-exist')
    );
    expect(message).toContain('Working directory not found');
    expect(message).toContain('not a permissions restriction');
  });
});
