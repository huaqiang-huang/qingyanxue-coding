import { describe, expect, it } from 'vitest';
import { deriveToolUseState } from '../src/renderer/utils/tool-use-state';
import type { TraceStep, ToolResultContent } from '../src/renderer/types';

describe('deriveToolUseState', () => {
  it('keeps tool card running only while trace is still active', () => {
    const traceSteps: TraceStep[] = [
      {
        id: 'tool-1',
        type: 'tool_call',
        status: 'running',
        title: 'Read file',
        timestamp: Date.now(),
      },
    ];

    expect(deriveToolUseState('tool-1', traceSteps, true)).toMatchObject({
      isRunning: true,
      isError: false,
      isSuccess: false,
    });
  });

  it('treats completed trace as finished even if tool_result message arrives late', () => {
    const traceSteps: TraceStep[] = [
      {
        id: 'tool-1',
        type: 'tool_call',
        status: 'completed',
        title: 'Read file',
        timestamp: Date.now(),
        duration: 123,
      },
    ];

    expect(deriveToolUseState('tool-1', traceSteps, true)).toMatchObject({
      isRunning: false,
      isError: false,
      isSuccess: true,
      duration: 123,
    });
  });

  it('prefers explicit tool_result error when present', () => {
    const traceSteps: TraceStep[] = [
      {
        id: 'tool-1',
        type: 'tool_call',
        status: 'completed',
        title: 'Read file',
        timestamp: Date.now(),
      },
    ];
    const toolResult: ToolResultContent = {
      type: 'tool_result',
      toolUseId: 'tool-1',
      content: 'boom',
      isError: true,
    };

    expect(deriveToolUseState('tool-1', traceSteps, false, toolResult)).toMatchObject({
      isRunning: false,
      isError: true,
      isSuccess: false,
    });
  });
});
