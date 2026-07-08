import { HarborRuntime } from "./index.js";
import { startHarborRuntimeServer } from "./server.js";

const port = Number.parseInt(process.env.HARBOR_RUNTIME_PORT ?? "8788", 10);
const host = process.env.HARBOR_RUNTIME_HOST ?? "127.0.0.1";
const identityEnvironmentStorePath = process.env.HARBOR_IDENTITY_ENVIRONMENTS_PATH;
const runtime = new HarborRuntime(undefined, identityEnvironmentStorePath ? { persistence_path: identityEnvironmentStorePath } : {});
const running = await startHarborRuntimeServer({ host, port, runtime });

console.log(JSON.stringify({
  service: "harbor-runtime-api",
  status: "ready",
  url: running.url,
  identity_environment_store: identityEnvironmentStorePath ? "configured" : "process_memory"
}));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await running.close();
    process.exit(0);
  });
}
