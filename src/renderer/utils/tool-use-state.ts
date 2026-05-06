import type { TraceStep, ToolResultContent } from '../types';

export function deriveToolUseState(
  toolUseId: string,
  traceSteps: TraceStep[],
  activeTurnPresent: boolean,
  toolResult?: ToolResultContent
): {
  isRunning: boolean;
  isError: boolean;
  isSuccess: boolean;
  duration?: number;
} {
  const matchingSteps = traceSteps.filter((step) => step.id === toolUseId);
  const latestStep = matchingSteps[matchingSteps.length - 1];
  const traceStatus = latestStep?.status;
  const isTraceTerminal = traceStatus === 'completed' || traceStatus === 'error';
  const traceIndicatesError = traceStatus === 'error' || latestStep?.isError === true;

  const isError = toolResult?.isError === true || (!toolResult && traceIndicatesError);
  const isSuccess =
    Boolean(toolResult && !toolResult.isError) || (!toolResult && traceStatus === 'completed');
  const isRunning =
    !toolResult &&
    !isTraceTerminal &&
    (traceStatus === 'running' || traceStatus === 'pending' || activeTurnPresent);

  return {
    isRunning,
    isError,
    isSuccess,
    duration: latestStep?.duration,
  };
}
