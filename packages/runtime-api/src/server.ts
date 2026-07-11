import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import {
  HarborRuntime,
  HARBOR_RUNTIME_FACTS_SCHEMA,
  type LocalIdentityEnvironmentStateUpdate,
  type ManagedLocalIdentityEnvironmentInput,
  type OpenIdentityEnvironmentSessionInput,
  type RuntimeErrorFact,
  type RuntimeSessionControlInput,
  type SiteResourceFactsInput,
  type WritePrecheckInput
} from "./index.js";
import { ManualAuthenticationAuthorizer } from "./manual-authentication-authorization.js";

export const HARBOR_RUNTIME_API_READINESS_SCHEMA = "harbor-runtime-api-readiness/v0";

export interface HarborRuntimeServerOptions {
  host?: string;
  port?: number;
  runtime?: HarborRuntime;
  manual_authentication_supervisor_token?: string;
}

export interface RunningHarborRuntimeServer {
  server: Server;
  host: string;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export function createHarborRuntimeHttpServer(
  runtime = new HarborRuntime(),
  options: Pick<HarborRuntimeServerOptions, "manual_authentication_supervisor_token"> = {}
): Server {
  const manualAuthenticationAuthorizer = new ManualAuthenticationAuthorizer(options.manual_authentication_supervisor_token);
  return createServer(async (request, response) => {
    try {
      await route(runtime, manualAuthenticationAuthorizer, request, response);
    } catch (error) {
      const badRequest = error instanceof BadRequest;
      writeJson(response, badRequest ? 400 : 500, {
        error: badRequest ? "bad_request" : "internal_error",
        message: badRequest && error instanceof Error ? error.message : "Internal Harbor Runtime API error."
      });
    }
  });
}

export async function startHarborRuntimeServer(options: HarborRuntimeServerOptions = {}): Promise<RunningHarborRuntimeServer> {
  const host = options.host ?? "127.0.0.1";
  const server = createHarborRuntimeHttpServer(options.runtime, options);
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

async function route(
  runtime: HarborRuntime,
  manualAuthenticationAuthorizer: ManualAuthenticationAuthorizer,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
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
    if (!authorizeCoreControl(manualAuthenticationAuthorizer, request, response)) return;
    const body = await readJson<OpenIdentityEnvironmentSessionInput & { identity_environment_ref?: string }>(request);
    if (body.identity_environment_ref) {
      const result = body.url
        ? await runtime.openManagedIdentityEnvironmentSession({ ...body, identity_environment_ref: body.identity_environment_ref })
        : await runtime.openManagedDefaultSiteSession({ ...body, identity_environment_ref: body.identity_environment_ref });
      writeJson(response, sessionOpenStatusCode(result), result);
      return;
    }
    if (!body.identity_environment) {
      writeJson(response, 400, identityEnvironmentRequired());
      return;
    }
    const result = await runtime.openIdentityEnvironmentSession(body);
    writeJson(response, sessionOpenStatusCode(result), result);
    return;
  }

  if (parts[0] === "runtime" && (parts[1] === "sessions" || parts[1] === "identity-environment-sessions") && parts[2]) {
    await routeSession(runtime, manualAuthenticationAuthorizer, parts[2], parts[3], method, request, response);
    return;
  }

  if (method === "GET" && parts[0] === "runtime" && parts[1] === "evidence" && parts[2]) {
    writeJson(response, 200, runtime.getPublicEvidence(parts[2]));
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
      "/runtime/sessions/{runtime_session_ref}/manual-authentication-completed",
      "/runtime/sessions/{runtime_session_ref}/read-operations",
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
  manualAuthenticationAuthorizer: ManualAuthenticationAuthorizer,
  runtimeSessionRef: string,
  action: string | undefined,
  method: string,
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  if (!action && method === "GET") {
    const session = runtime.getSession(runtimeSessionRef);
    const unavailable = sessionReadUnavailable(runtimeSessionRef, session?.current_error);
    writeJson(response, unavailable ? 404 : 200, unavailable ?? session);
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
  if (action === "read-operations" && method === "POST") {
    if (!authorizeCoreControl(manualAuthenticationAuthorizer, request, response)) return;
    const result = await runtime.executeAllowlistedReadOperation(runtimeSessionRef, await readJson<unknown>(request));
    writeJson(response, readOperationStatusCode(result), result);
    return;
  }
  if (action === "manual-authentication-completed" && method === "POST") {
    const authorization = manualAuthenticationAuthorizer.authorizeManualAuthentication(request, runtimeSessionRef);
    if (!authorization.authorized) {
      writeJson(response, authorization.status_code, { failure_class: authorization.failure_class });
      return;
    }
    const requestUrl = new URL(request.url ?? "/", "http://harbor.local");
    if (requestUrl.search) throw new BadRequest("Manual authentication completion does not accept query parameters.");
    await requireEmptyRequestBody(request);
    const result = runtime.completeManualAuthentication(runtimeSessionRef, authorization.grant);
    writeJson(response, result.status === "unavailable" ? result.failure_class === "session_missing" ? 404 : 409 : 200, result);
    return;
  }
  if (method !== "POST") {
    writeJson(response, 405, { error: "method_not_allowed", method });
    return;
  }
  if (!authorizeCoreControl(manualAuthenticationAuthorizer, request, response)) return;
  const body = await readJson<RuntimeSessionControlInput>(request, {});
  if (action === "lock") writeJson(response, 200, runtime.lockSession(runtimeSessionRef, body));
  else if (action === "release") writeJson(response, 200, runtime.releaseSession(runtimeSessionRef, body));
  else if (action === "stop") writeJson(response, 200, await runtime.stopSession(runtimeSessionRef, body));
  else if (action === "snapshot") writeJson(response, 201, await runtime.captureLiveSnapshot(runtimeSessionRef));
  else writeJson(response, 404, { error: "not_found", path: `/runtime/sessions/${runtimeSessionRef}/${action}` });
}

function authorizeCoreControl(
  manualAuthenticationAuthorizer: ManualAuthenticationAuthorizer,
  request: IncomingMessage,
  response: ServerResponse
): boolean {
  const authorization = manualAuthenticationAuthorizer.authorize(request);
  if (authorization.authorized) return true;
  writeJson(response, authorization.status_code, { failure_class: authorization.failure_class });
  return false;
}

function sessionReadUnavailable(runtimeSessionRef: string, currentError: RuntimeErrorFact | null | undefined): object | null {
  if (currentError?.code !== "session_lost" && currentError !== undefined) return null;
  const failure_class = currentError ? "session_lost" : "session_missing";
  const publicError = currentError ?? {
    code: "session_lost" as const,
    message: "Runtime Session is missing.",
    retryable: true
  };
  return {
    schema_version: HARBOR_RUNTIME_FACTS_SCHEMA,
    status: "unavailable",
    failure_class,
    runtime_session_ref: runtimeSessionRef,
    retryable: publicError.retryable,
    message: publicError.message,
    current_error: publicError
  };
}

function siteResourceFactsInput(url: URL): SiteResourceFactsInput {
  return {
    site_id: url.searchParams.get("site_id") ?? undefined,
    task_kind: url.searchParams.get("task_kind") ?? undefined
  };
}

function readOperationStatusCode(result: { status: string; failure_class?: string }): number {
  if (result.status === "completed") return 201;
  if (result.failure_class === "session_missing") return 404;
  if (["invalid_request", "operation_not_allowlisted", "allowlist_pin_invalid", "target_url_invalid", "target_origin_not_allowed", "target_path_not_allowlisted"].includes(result.failure_class ?? "")) return 400;
  return 409;
}

function sessionOpenStatusCode(result: unknown): number {
  return typeof result === "object" && result !== null && "status" in result && result.status === "unavailable" ? 409 : 201;
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

async function requireEmptyRequestBody(request: IncomingMessage): Promise<void> {
  for await (const chunk of request) {
    if ((Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk)) > 0) {
      throw new BadRequest("Manual authentication completion requires an empty request body.");
    }
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
