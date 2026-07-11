import type { LocalProviderReadProbeInput, LocalProviderReadProbeResult } from "./runtime-session-types.js";

export type ReadOperationProbe = (input: LocalProviderReadProbeInput) => Promise<LocalProviderReadProbeResult>;

// Only Harbor's concrete local-provider adapter may register a probe that can
// produce an operation completion. Test and fixture launchers remain fail-closed.
const trustedReadOperationProbes = new WeakSet<ReadOperationProbe>();

export function trustLocalProviderReadProbe(probe: ReadOperationProbe): ReadOperationProbe {
  trustedReadOperationProbes.add(probe);
  return probe;
}

export function isTrustedLocalProviderReadProbe(probe: ReadOperationProbe | undefined): probe is ReadOperationProbe {
  return probe !== undefined && trustedReadOperationProbes.has(probe);
}
