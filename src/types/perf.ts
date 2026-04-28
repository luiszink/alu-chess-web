export type DaoName = string; // 'postgres' | 'mongo' | 'memory' (open for new backends)

export type BenchmarkOp =
  | 'Insert'
  | 'FindAll'
  | 'FindById'
  | 'Delete'
  | 'Mixed';

export interface BenchmarkConfig {
  operation: BenchmarkOp;
  recordCount: number;
  iterations: number;
  warmupIterations: number;
  seed: number;
}

export interface BenchmarkStats {
  minMs: number;
  maxMs: number;
  meanMs: number;
  medianMs: number;
  p95Ms: number;
  p99Ms: number;
  opsPerSec: number;
  totalMs: number;
  iterations: number;
}

export interface BenchmarkResult {
  id: string;
  dao: DaoName;
  config: BenchmarkConfig;
  stats: BenchmarkStats;
  startedAt: string;
  durationMs: number;
  latenciesMs: number[];
  opsPerIteration: number;
}

export interface DaoStatus {
  name: DaoName;
  available: boolean;
  error: string | null;
}

export interface DaoListResponse {
  daos: DaoStatus[];
}

export interface CompareEntry {
  dao: DaoName;
  ok: boolean;
  result?: BenchmarkResult;
  message?: string;
}

export interface CompareResponse {
  config: BenchmarkConfig;
  results: CompareEntry[];
}

export interface RunsListResponse {
  runs: BenchmarkResult[];
}
