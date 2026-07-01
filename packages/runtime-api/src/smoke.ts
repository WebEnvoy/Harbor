import { createFixtureLauncher, HarborRuntime } from "./index.js";

const useLocalProvider = process.argv.includes("--local");
const runtime = new HarborRuntime(useLocalProvider ? undefined : createFixtureLauncher("ready"));
const session = await runtime.createSession();
const readback = runtime.getSession(session.runtime_session_ref);
const closed = await runtime.closeSession(session.runtime_session_ref);

console.log(JSON.stringify({ mode: useLocalProvider ? "local" : "fixture", session, readback, closed }, null, 2));

if (!readback || !closed) {
  process.exitCode = 1;
}
