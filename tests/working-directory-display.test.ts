import { describe, expect, it } from 'vitest';
import { isInternalDefaultWorkingDir } from '../src/renderer/utils/working-directory-display';

describe('isInternalDefaultWorkingDir', () => {
  it('detects macOS internal default working dirs', () => {
    expect(
      isInternalDefaultWorkingDir(
        '/Users/demo/Library/Application Support/open-cowork/default_working_dir'
      )
    ).toBe(true);
    expect(
      isInternalDefaultWorkingDir(
        '/Users/demo/Library/Application Support/qingyanxue-coding/default_working_dir'
      )
    ).toBe(true);
  });

  it('does not flag user project folders', () => {
    expect(isInternalDefaultWorkingDir('/Users/demo/project')).toBe(false);
  });
});
