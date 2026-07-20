export interface ProviderLifecycleIdempotencyOptions {
  ttl_ms?: number;
  capacity?: number;
  now?: () => number;
}

interface Receipt<T> {
  fingerprint: string;
  createdAt: number;
  sequence: number;
  result: Promise<T>;
  settled: boolean;
}

export class ProviderLifecycleIdempotencyConflict extends Error {}
export class ProviderLifecycleIdempotencyCapacityError extends Error {}

export class ProviderLifecycleIdempotencyStore {
  private readonly ttlMs: number;
  private readonly capacity: number;
  private readonly now: () => number;
  private readonly receipts = new Map<string, Receipt<unknown>>();
  private sequence = 0;

  constructor(options: ProviderLifecycleIdempotencyOptions = {}) {
    this.ttlMs = boundedInteger(options.ttl_ms, 10 * 60_000, 1, 24 * 60 * 60_000);
    this.capacity = boundedInteger(options.capacity, 1_000, 1, 10_000);
    this.now = options.now ?? Date.now;
  }

  execute<T>(key: string, fingerprint: string, operation: () => Promise<T>): Promise<T> {
    this.expire();
    const receipt = this.receipts.get(key);
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) throw new ProviderLifecycleIdempotencyConflict("Idempotency-Key was already used for a different request.");
      return receipt.result as Promise<T>;
    }
    if (!this.evictForCapacity()) throw new ProviderLifecycleIdempotencyCapacityError("Provider idempotency receipt capacity is temporarily full.");
    const result = Promise.resolve().then(operation);
    const next: Receipt<T> = { fingerprint, createdAt: this.now(), sequence: this.sequence++, result, settled: false };
    this.receipts.set(key, next);
    void result.then(() => { next.settled = true; }, () => { next.settled = true; });
    return result;
  }

  private expire(): void {
    const cutoff = this.now() - this.ttlMs;
    for (const [key, receipt] of this.receipts) {
      if (receipt.settled && receipt.createdAt <= cutoff) this.receipts.delete(key);
    }
  }

  private evictForCapacity(): boolean {
    while (this.receipts.size >= this.capacity) {
      let oldest: [string, Receipt<unknown>] | null = null;
      for (const entry of this.receipts) {
        if (entry[1].settled && (!oldest || entry[1].sequence < oldest[1].sequence)) oldest = entry;
      }
      if (!oldest) return false;
      this.receipts.delete(oldest[0]);
    }
    return true;
  }
}

function boundedInteger(value: number | undefined, fallback: number, minimum: number, maximum: number): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new Error("Invalid provider idempotency store bounds.");
  return value;
}
