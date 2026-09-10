import { performance } from "node:perf_hooks";

export function measureOperation(operation: () => unknown) {
  for (let index = 0; index < 10; index++) operation();
  const samples = [];
  for (let index = 0; index < 30; index++) {
    const started = performance.now();
    operation();
    samples.push(performance.now() - started);
  }
  samples.sort((left, right) => left - right);
  return {
    p50ms: Number(samples[15]!.toFixed(3)),
    p95ms: Number(samples[28]!.toFixed(3)),
  };
}
