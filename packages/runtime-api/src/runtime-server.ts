import { startHarborRuntimeServer } from "./server.js";

const port = Number.parseInt(process.env.HARBOR_RUNTIME_PORT ?? "8788", 10);
const host = process.env.HARBOR_RUNTIME_HOST ?? "127.0.0.1";
const running = await startHarborRuntimeServer({ host, port });

console.log(JSON.stringify({
  service: "harbor-runtime-api",
  status: "ready",
  url: running.url
}));

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, async () => {
    await running.close();
    process.exit(0);
  });
}
