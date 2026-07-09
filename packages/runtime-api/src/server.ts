import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  HarborRuntime,
  type LocalIdentityEnvironmentStateUpdate,
  type ManagedLocalIdentityEnvironmentInput,
  type OpenIdentityEnvironmentSessionInput,
  type RuntimeSessionControlInput,
  type SiteResourceFactsInput,
  type WritePrecheckInput
} from "./index.js";

export const HARBOR_RUNTIME_API_READINESS_SCHEMA = "harbor-runtime-api-readiness/v0";

export interface HarborRuntimeServerOptions {
  host?: string;
  port?: number;
  runtime?: HarborRuntime;
}

export interface RunningHarborRuntimeServer {
  server: Server;
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export function createHarborRuntimeHttpServer(runtime = new HarborRuntime()): Server {
  return createServer(async (request, response) => {
    try {
      await route(runtime, request, response);
    } catch (error) {
      const badRequest = error instanceof BadRequest;
      writeJson(response, badRequest ? 400 : 500, {
        error: badRequest ? "bad_request" : "internal_error",
        message: error instanceof Error ? error.message : "Unhandled Harbor Runtime API error."
      });
    }
  });
}

export async function startHarborRuntimeServer(options: HarborRuntimeServerOptions = {}): Promise<RunningHarborRuntimeServer> {
  const host = options.host ?? "127.0.0.1";
  const server = createHarborRuntimeHttpServer(options.runtime);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(options.port ?? 8788, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port ?? 8788;
  return {
    server,
    host,
    port,
    url: `http://${host}:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

async function route(runtime: HarborRuntime, request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://harbor.local");
  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);

  if (method === "GET" && ["/health", "/ready", "/readiness", "/runtime/health"].includes(url.pathname)) {
    writeJson(response, 200, readinessBody());
    return;
  }

  if (method === "GET" && (url.pathname === "/runtime/browser-providers" || url.pathname === "/runtime/browser-provider-status")) {
    writeJson(response, 200, runtime.getBrowserProviderStatus());
    return;
  }

  if (method === "GET" && url.pathname === "/runtime/identity-environments") {
    writeJson(response, 200, {
      schema_version: "harbor-runtime-api-identity-environments/v0",
      identity_environments: runtime.listLocalIdentityEnvironments()
    });
    return;
  }

  if (method === "POST" && url.pathname === "/runtime/identity-environments") {
    const body = await readJson<ManagedLocalIdentityEnvironmentInput & { operation?: "create" | "import" }>(request);
    const operation = body.operation ?? "create";
    writeJson(response, 201, operation === "import" ? runtime.importLocalIdentityEnvironment(body) : runtime.createLocalIdentityEnvironment(body));
    return;
  }

  if (parts[0] === "runtime" && parts[1] === "identity-environments" && parts[2] && parts.length === 3) {
    await routeIdentityEnvironment(runtime, parts[2], method, request, response);
    return;
  }

  if (method === "POST" && url.pathname === "/runtime/identity-environment-sessions") {
    const body = await readJson<OpenIdentityEnvironmentSessionInput & { identity_environment_ref?: string }>(request);
    if (body.identity_environment_ref) {
      const result = body.url
        ? await runtime.openManagedIdentityEnvironmentSession({ ...body, identity_environment_ref: body.identity_environment_ref })
        : await runtime.openManagedDefaultSiteSession({ ...body, identity_environment_ref: body.identity_environment_ref });
      writeJson(response, 201, result);
      return;
    }
    if (!body.identity_environment) {
      writeJson(response, 400, identityEnvironmentRequired());
      return;
    }
    writeJson(response, 201, await runtime.openIdentityEnvironmentSession(body));
    return;
  }

  if (parts[0] === "runtime" && (parts[1] === "sessions" || parts[1] === "identity-environment-sessions") && parts[2]) {
    await routeSession(runtime, parts[2], parts[3], method, request, response);
    return;
  }

  if (method === "GET" && parts[0] === "runtime" && parts[1] === "evidence" && parts[2]) {
    writeJson(response, 200, runtime.getEvidence(parts[2]));
    return;
  }

  writeJson(response, 404, { error: "not_found", path: url.pathname });
}

function readinessBody(): object {
  return {
    schema_version: HARBOR_RUNTIME_API_READINESS_SCHEMA,
    status: "ready",
    service: "harbor-runtime-api",
    generated_at: new Date().toISOString(),
    endpoints: [
      "/health",
      "/ready",
      "/readiness",
      "/runtime/health",
      "/runtime/browser-providers",
      "/runtime/identity-environments",
      "/runtime/identity-environments/{identity_environment_ref}",
      "/runtime/identity-environment-sessions",
      "/runtime/sessions/{runtime_session_ref}",
      "/runtime/sessions/{runtime_session_ref}/site-resource-facts",
      "/runtime/sessions/{runtime_session_ref}/write-precheck-facts",
      "/runtime/evidence/{evidence_ref}"
    ],
    safety_boundary: {
      raw_credentials: "not_exposed",
      raw_profile_storage: "not_exposed",
      raw_cdp_endpoint: "not_exposed",
      raw_dom: "not_exposed",
      raw_har: "not_exposed",
      raw_network_bodies: "not_exposed",
      screenshot_body: "not_exposed",
      hosted_browser: "not_provided",
      external_write_actions: "not_performed"
    }
  };
}

async function routeIdentityEnvironment(
  runtime: HarborRuntime,
  identityEnvironmentRef: string,
  method: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (method === "GET") {
    const record = runtime.getManagedLocalIdentityEnvironment(identityEnvironmentRef);
    writeJson(response, record ? 200 : 404, record ?? identityEnvironmentMissing(identityEnvironmentRef));
    return;
  }
  if (method === "PATCH") {
    const body = await readJson<LocalIdentityEnvironmentStateUpdate>(request);
    const record = runtime.updateLocalIdentityEnvironment(identityEnvironmentRef, body);
    writeJson(response, record ? 200 : 404, record ?? identityEnvironmentMissing(identityEnvironmentRef));
    return;
  }
  if (method === "DELETE") {
    const record = runtime.deleteLocalIdentityEnvironment(identityEnvironmentRef);
    writeJson(response, record ? 200 : 404, record ?? identityEnvironmentMissing(identityEnvironmentRef));
    return;
  }
  writeJson(response, 405, { error: "method_not_allowed", method });
}

async function routeSession(
  runtime: HarborRuntime,
  runtimeSessionRef: string,
  action: string | undefined,
  method: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (!action && method === "GET") {
    writeJson(response, 200, runtime.getSession(runtimeSessionRef) ?? { status: "unavailable", failure_class: "session_missing" });
    return;
  }
  if (action === "site-resource-facts" && method === "GET") {
    const requestUrl = new URL(request.url ?? "/", "http://harbor.local");
    writeJson(response, 200, runtime.getSiteResourceFacts(runtimeSessionRef, siteResourceFactsInput(requestUrl)));
    return;
  }
  if (action === "write-precheck-facts" && method === "POST") {
    writeJson(response, 200, runtime.getSessionWritePrecheckFacts(runtimeSessionRef, await readJson<WritePrecheckInput>(request, {})));
    return;
  }
  if (method !== "POST") {
    writeJson(response, 405, { error: "method_not_allowed", method });
    return;
  }
  const body = await readJson<RuntimeSessionControlInput>(request, {});
  if (action === "lock") writeJson(response, 200, runtime.lockSession(runtimeSessionRef, body));
  else if (action === "release") writeJson(response, 200, runtime.releaseSession(runtimeSessionRef, body));
  else if (action === "stop") writeJson(response, 200, await runtime.stopSession(runtimeSessionRef, body));
  else if (action === "snapshot") writeJson(response, 201, await runtime.captureLiveSnapshot(runtimeSessionRef));
  else writeJson(response, 404, { error: "not_found", path: `/runtime/sessions/${runtimeSessionRef}/${action}` });
}

function siteResourceFactsInput(url: URL): SiteResourceFactsInput {
  return {
    site_id: url.searchParams.get("site_id") ?? undefined,
    task_kind: url.searchParams.get("task_kind") ?? undefined
  };
}

async function readJson<T>(request: IncomingMessage, fallback?: T): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) throw new BadRequest("Request body exceeds 1MB.");
    chunks.push(buffer);
  }
  if (chunks.length === 0) {
    if (fallback !== undefined) return fallback;
    throw new BadRequest("Expected JSON request body.");
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as T;
  } catch {
    throw new BadRequest("Invalid JSON request body.");
  }
}

function writeJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function identityEnvironmentMissing(identity_environment_ref: string): object {
  return {
    status: "unavailable",
    failure_class: "identity_environment_missing",
    identity_environment_ref,
    retryable: true,
    public_boundary: {
      output: "status_and_redacted_refs_only",
      raw_material: "not_exposed"
    }
  };
}

function identityEnvironmentRequired(): object {
  return {
    status: "unavailable",
    failure_class: "identity_environment_required",
    message: "identity_environment_ref or identity_environment is required.",
    retryable: true,
    public_boundary: {
      output: "status_and_redacted_refs_only",
      raw_material: "not_exposed"
    }
  };
}

class BadRequest extends Error {}
