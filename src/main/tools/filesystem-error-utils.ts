export function normalizeFilesystemErrorMessage(
  action: 'read' | 'write' | 'list' | 'edit' | 'search' | 'glob' | 'grep' | 'command',
  targetPath: string | undefined,
  error: unknown
): string {
  const raw = error instanceof Error ? error.message : String(error);
  const normalizedPath = targetPath?.trim() || '';
  const lower = raw.toLowerCase();
  const insideAsar = /\.asar([/\\]|$)/i.test(normalizedPath);

  if (lower.includes('working directory not found')) {
    return `Working directory not found: ${normalizedPath || raw.replace(/^.*?:\s*/, '')}. The selected folder is missing or no longer exists. This is a missing-path problem, not a permissions restriction.`;
  }

  if (
    lower.includes('file not found') ||
    lower.includes('directory not found') ||
    lower.includes('path not found') ||
    lower.includes('enoent')
  ) {
    if (insideAsar) {
      return `${capitalizeAction(action)} failed: ${normalizedPath} was not found. This path points inside a packaged .asar archive, which is not a normal folder on disk. Only files that actually exist in the packaged bundle can be read from there. This is a missing-path problem, not a filesystem permission restriction.`;
    }
    return `${capitalizeAction(action)} failed: ${normalizedPath || 'target path'} was not found. This is a missing-path problem, not a filesystem permission restriction.`;
  }

  if (insideAsar && lower.includes('not a directory')) {
    return `${capitalizeAction(action)} failed: ${normalizedPath} points inside a packaged .asar archive, which does not behave like a normal directory on disk. Use a real filesystem path or an existing file inside the packaged bundle.`;
  }

  return raw;
}

function capitalizeAction(action: string): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}
