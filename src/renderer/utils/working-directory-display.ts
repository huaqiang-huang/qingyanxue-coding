const INTERNAL_DEFAULT_DIR_PATTERNS = [
  /[/\\](open-cowork|qingyanxue-coding)[/\\]default_working_dir$/i,
  /AppData[/\\]Roaming[/\\](open-cowork|qingyanxue-coding)[/\\]default_working_dir$/i,
  /[/\\]\.config[/\\](open-cowork|qingyanxue-coding)[/\\]default_working_dir$/i,
];

export function isInternalDefaultWorkingDir(pathValue?: string | null): boolean {
  if (!pathValue) return false;
  return INTERNAL_DEFAULT_DIR_PATTERNS.some((pattern) => pattern.test(pathValue.trim()));
}
