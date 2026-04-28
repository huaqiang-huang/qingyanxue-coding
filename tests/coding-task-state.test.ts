import { describe, expect, it } from 'vitest';
import {
  buildTaskStatePreamble,
  classifyToolCall,
  deriveTaskSnapshot,
} from '../src/shared/coding-task-state';
import type { Message, TraceStep } from '../src/renderer/types';

describe('coding-task-state helpers', () => {
  it('classifies verification-heavy bash commands clearly', () => {
    const result = classifyToolCall('bash', { command: 'npm test -- --run' });
    expect(result.kind).toBe('verification');
    expect(result.summary).toContain('Verify');
  });

  it('classifies file edits as high-risk mutations', () => {
    const result = classifyToolCall('edit', { file_path: 'src/app.ts' });
    expect(result.kind).toBe('mutation');
    expect(result.risk).toBe('high');
  });

  it('derives objective, todo progress, and verification state from a run', () => {
    const messages: Message[] = [
      {
        id: 'u1',
        sessionId: 's1',
        role: 'user',
        content: [{ type: 'text', text: 'Fix the failing tests and verify the result.' }],
        timestamp: 100,
      },
      {
        id: 'a1',
        sessionId: 's1',
        role: 'assistant',
        content: [
          {
            type: 'tool_use',
            id: 'todo-1',
            name: 'todowrite',
            input: {
              todos: [
                { content: 'Inspect the failing test', status: 'completed' },
                { content: 'Patch the bug', status: 'completed' },
                { content: 'Run the test suite', status: 'in_progress' },
              ],
            },
          },
        ],
        timestamp: 130,
      },
    ];

    const steps: TraceStep[] = [
      {
        id: 'step-1',
        type: 'tool_call',
        status: 'completed',
        title: 'Edit files · src/app.ts',
        toolName: 'edit',
        toolInput: { file_path: 'src/app.ts' },
        timestamp: 140,
      },
    ];

    const snapshot = deriveTaskSnapshot(messages, steps);
    expect(snapshot.objective).toContain('Fix the failing tests');
    expect(snapshot.todo).toEqual({
      total: 3,
      completed: 2,
      inProgress: 'Run the test suite',
    });
    expect(snapshot.verification.status).toBe('needed');
  });

  it('builds a compact task-state preamble for model reinjection', () => {
    const messages: Message[] = [
      {
        id: 'u1',
        sessionId: 's1',
        role: 'user',
        content: [{ type: 'text', text: 'Refactor the parser and verify it still passes.' }],
        timestamp: 100,
      },
    ];
    const steps: TraceStep[] = [
      {
        id: 'tool-1',
        type: 'tool_call',
        status: 'error',
        title: 'Verify · npm test -- parser',
        toolName: 'bash',
        toolInput: { command: 'npm test -- parser' },
        toolOutput: 'Command failed with exit code 1',
        timestamp: 150,
        isError: true,
      },
    ];

    const preamble = buildTaskStatePreamble(messages, steps, { includeRecentSteps: true });
    expect(preamble).toContain('<current_task_state>');
    expect(preamble).toContain('Objective: Refactor the parser');
    expect(preamble).toContain('Latest blocker: Command failed with exit code 1');
    expect(preamble).toContain('Recovery preference: inspect the failure');
  });
});
