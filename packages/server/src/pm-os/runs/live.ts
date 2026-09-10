import type { PmAnswers } from "@digipm/contracts/pm-os";
export type PmControl = {
  signal: AbortSignal;
  pause: () => Promise<void>;
  continue: () => Promise<void>;
  stop: () => Promise<void>;
};
export const activePmRuns = new Map<string, PmControl>();
export const questionWaiters = new Map<
  string,
  {
    runId: string;
    resolve: (answers: PmAnswers) => void;
    reject: (error: Error) => void;
  }
>();

export const runTasks = new Map<string, Set<Promise<unknown>>>();
