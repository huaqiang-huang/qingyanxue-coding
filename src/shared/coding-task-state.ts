import type { ContentBlock, Message, TraceStep } from '../renderer/types';

export type ToolKind =
  | 'verification'
  | 'mutation'
  | 'inspection'
  | 'planning'
  | 'question'
  | 'network'
  | 'other';

export type ToolRisk = 'low' | 'medium' | 'high';

export interface ToolClassification {
  kind: ToolKind;
  risk: ToolRisk;
  summary: string;
}

export interface TodoSnapshot {
  total: number;
  completed: number;
  inProgress: string | null;
}

export interface TaskSnapshot {
  objective: string | null;
  nextAction: string | null;
  todo: TodoSnapshot | null;
  verification: {
    status: 'verified' | 'needed' | 'running' | 'idle';
    label: string;
  };
  lastFailure: string | null;
}

interface TimestampedFailure {
  text: string;
  timestamp: number;
}

interface TodoLikeItem {
  content?: string;
  activeForm?: string;
  status?: string;
}

function truncate(text: string, max = 96): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

function toDisplayText(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function pickInputPreview(input: Record<string, unknown> | undefined): string | null {
  if (!input) return null;
  const directKeys = [
    'command',
    'cmd',
    'query',
    'pattern',
    'path',
    'file_path',
    'filePath',
    'url',
    'prompt',
  ];
  for (const key of directKeys) {
    const value = toDisplayText(input[key]);
    if (value) return truncate(value, 88);
  }
  for (const [key, raw] of Object.entries(input)) {
    const value = toDisplayText(raw);
    if (value) return truncate(`${key}: ${value}`, 88);
  }
  return null;
}

function classifyBashCommand(command: string): ToolClassification {
  const normalized = command.trim().toLowerCase();
  const summary = truncate(command, 88);
  if (
    /\b(npm test|pnpm test|yarn test|vitest|jest|pytest|cargo test|go test|tsc\b|typecheck|lint|eslint|ruff|mypy|build)\b/.test(
      normalized
    )
  ) {
    return { kind: 'verification', risk: 'medium', summary: `Verify · ${summary}` };
  }
  if (
    /\b(rg|grep|find|ls|tree|cat|sed|head|tail|wc|git status|git diff|git show)\b/.test(normalized)
  ) {
    return { kind: 'inspection', risk: 'low', summary: `Inspect · ${summary}` };
  }
  if (
    /\b(mv|cp|rm|mkdir|touch|chmod|chown|tee|echo)\b/.test(normalized) ||
    />/.test(normalized)
  ) {
    return { kind: 'mutation', risk: 'high', summary: `Change files · ${summary}` };
  }
  return { kind: 'other', risk: 'high', summary: `Run shell · ${summary}` };
}

export function classifyToolCall(
  toolName: string | undefined,
  input?: Record<string, unknown>
): ToolClassification {
  const name = (toolName || 'tool').toLowerCase();
  const preview = pickInputPreview(input);

  if (name === 'bash' || name === 'execute_command') {
    const command = toDisplayText(input?.command) || toDisplayText(input?.cmd) || preview || name;
    return classifyBashCommand(command);
  }

  if (name === 'read' || name === 'list_directory' || name === 'glob' || name === 'grep') {
    return {
      kind: 'inspection',
      risk: 'low',
      summary: truncate(`Inspect · ${preview || name}`, 88),
    };
  }

  if (name === 'webfetch' || name === 'websearch') {
    return {
      kind: 'network',
      risk: 'low',
      summary: truncate(`Research · ${preview || name}`, 88),
    };
  }

  if (name === 'write' || name === 'edit' || name === 'write_file' || name === 'edit_file') {
    return {
      kind: 'mutation',
      risk: 'high',
      summary: truncate(`Edit files · ${preview || name}`, 88),
    };
  }

  if (name === 'todowrite' || name === 'todoread') {
    return {
      kind: 'planning',
      risk: 'low',
      summary: name === 'todowrite' ? 'Update task plan' : 'Read task plan',
    };
  }

  if (name === 'askuserquestion') {
    return {
      kind: 'question',
      risk: 'low',
      summary: truncate(`Need input · ${preview || name}`, 88),
    };
  }

  return {
    kind: 'other',
    risk: name.startsWith('mcp__') ? 'medium' : 'low',
    summary: truncate(preview ? `${toolName} · ${preview}` : toolName || 'Tool call', 88),
  };
}

export function isAlwaysAllowSafe(classification: ToolClassification): boolean {
  return classification.risk === 'low' && classification.kind !== 'mutation';
}

function extractTextFromContent(content: ContentBlock[]): string {
  return content
    .flatMap((block) => {
      if (block.type === 'text') return [block.text];
      if (block.type === 'thinking') return [block.thinking];
      return [];
    })
    .join('\n')
    .trim();
}

function getLatestTodoSnapshot(messages: Message[]): TodoSnapshot | null {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    for (const block of message.content) {
      if (block.type !== 'tool_use' || !block.name.toLowerCase().includes('todo')) continue;
      const todos = ((block.input as Record<string, unknown>)?.todos as TodoLikeItem[] | undefined) || [];
      if (todos.length === 0) continue;
      const completed = todos.filter((item) => item.status === 'completed').length;
      const inProgress =
        todos.find((item) => item.status === 'in_progress')?.activeForm ||
        todos.find((item) => item.status === 'in_progress')?.content ||
        null;
      return { total: todos.length, completed, inProgress };
    }
  }
  return null;
}

export function deriveTaskSnapshot(messages: Message[], steps: TraceStep[]): TaskSnapshot {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user') || null;
  const objective = lastUserMessage ? truncate(extractTextFromContent(lastUserMessage.content), 120) : null;
  const since = lastUserMessage?.timestamp ?? 0;
  const recentSteps = steps.filter((step) => step.timestamp >= since);
  const todo = getLatestTodoSnapshot(messages);
  const activeStep = [...recentSteps].reverse().find((step) => step.status === 'running') || null;

  let sawMutation = false;
  let sawVerification = false;
  let verificationRunning = false;
  let latestFailure: TimestampedFailure | null = null;
  let latestRecoveryTimestamp = 0;

  for (let i = recentSteps.length - 1; i >= 0; i -= 1) {
    const step = recentSteps[i];
    const classification = classifyToolCall(step.toolName, step.toolInput);
    if (step.status === 'completed' && !step.isError) {
      latestRecoveryTimestamp = Math.max(latestRecoveryTimestamp, step.timestamp);
    }
    if (!latestFailure && (step.status === 'error' || step.isError)) {
      latestFailure = {
        text: truncate(step.toolOutput || step.title || 'A tool step failed', 120),
        timestamp: step.timestamp,
      };
    }
    if (classification.kind === 'mutation' && step.status === 'completed') {
      sawMutation = true;
    }
    if (classification.kind === 'verification') {
      if (step.status === 'running') verificationRunning = true;
      if (step.status === 'completed' && !step.isError) sawVerification = true;
    }
  }

  if (!latestFailure) {
    const failedMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.timestamp >= since &&
          message.role === 'assistant' &&
          extractTextFromContent(message.content).startsWith('**Error**:')
      );
    if (failedMessage) {
      latestFailure = {
        text: truncate(extractTextFromContent(failedMessage.content), 120),
        timestamp: failedMessage.timestamp,
      };
    }
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message.timestamp < since) break;
    if (message.role === 'assistant' && !extractTextFromContent(message.content).startsWith('**Error**:')) {
      latestRecoveryTimestamp = Math.max(latestRecoveryTimestamp, message.timestamp);
      break;
    }
  }

  const lastFailure =
    latestFailure && latestFailure.timestamp >= latestRecoveryTimestamp ? latestFailure.text : null;

  let verification: TaskSnapshot['verification'];
  if (verificationRunning) {
    verification = { status: 'running', label: 'Verifying changes' };
  } else if (sawVerification) {
    verification = { status: 'verified', label: 'Verified in this run' };
  } else if (sawMutation) {
    verification = { status: 'needed', label: 'Changes made, verification still needed' };
  } else {
    verification = { status: 'idle', label: 'No verification step yet' };
  }

  const nextAction = todo?.inProgress
    ? truncate(todo.inProgress, 120)
    : activeStep?.title
      ? truncate(activeStep.title, 120)
      : verification.status === 'needed'
        ? verification.label
        : null;

  return {
    objective,
    nextAction,
    todo,
    verification,
    lastFailure,
  };
}

export function buildTaskStatePreamble(
  messages: Message[],
  steps: TraceStep[],
  options?: { includeRecentSteps?: boolean }
): string | null {
  const snapshot = deriveTaskSnapshot(messages, steps);
  const lines: string[] = [];

  if (snapshot.objective) {
    lines.push(`Objective: ${snapshot.objective}`);
  }

  if (snapshot.todo) {
    lines.push(
      `Todo progress: ${snapshot.todo.completed}/${snapshot.todo.total}${
        snapshot.todo.inProgress ? `; in progress: ${snapshot.todo.inProgress}` : ''
      }`
    );
  }

  if (snapshot.nextAction) {
    lines.push(`Likely next action: ${snapshot.nextAction}`);
  }

  lines.push(`Verification: ${snapshot.verification.label}`);

  if (snapshot.lastFailure) {
    lines.push(`Latest blocker: ${snapshot.lastFailure}`);
    lines.push('Recovery preference: inspect the failure, adjust once, then continue if the retry works.');
  }

  if (options?.includeRecentSteps) {
    const recentRelevantSteps = steps
      .filter((step) => step.type === 'tool_call' || step.type === 'tool_result')
      .slice(-6)
      .map((step) => {
        const status =
          step.status === 'error' || step.isError
            ? 'error'
            : step.status === 'running'
              ? 'running'
              : 'done';
        const label = truncate(step.title || step.toolName || step.type, 88);
        return `- ${status}: ${label}`;
      });
    if (recentRelevantSteps.length > 0) {
      lines.push('Recent steps:');
      lines.push(...recentRelevantSteps);
    }
  }

  if (lines.length === 0) {
    return null;
  }

  return `<current_task_state>\n${lines.join('\n')}\n</current_task_state>`;
}
