import { resolve } from "node:path";

import { e2eBaseURL, e2eEnvironment } from "../tests/e2e/environment";

const projectRoot = resolve(import.meta.dir, "..");
const environment = { ...process.env, ...e2eEnvironment };
const nodeExecutable = Bun.which("node");

if (!nodeExecutable) {
  throw new Error("Node.js is required to run the Playwright test runner.");
}

async function runCommand(command: string[]): Promise<void> {
  const childProcess = Bun.spawn(command, {
    cwd: projectRoot,
    env: environment,
    stderr: "inherit",
    stdout: "inherit",
  });
  const exitCode = await childProcess.exited;

  if (exitCode !== 0) {
    throw new Error(`${command.join(" ")} failed with exit code ${exitCode}.`);
  }
}

async function waitForServer(serverProcess: Bun.Subprocess): Promise<void> {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    if (serverProcess.exitCode !== null) {
      throw new Error(`The E2E server exited with code ${serverProcess.exitCode}.`);
    }

    try {
      const response = await fetch(`${e2eBaseURL}/favicon.ico`);

      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await Bun.sleep(100);
  }

  throw new Error(`The E2E server did not become ready at ${e2eBaseURL}.`);
}

await runCommand([process.execPath, "run", "test:e2e:prepare"]);
await runCommand([process.execPath, "run", "build"]);

const serverProcess = Bun.spawn(
  [
    process.execPath,
    resolve(projectRoot, "node_modules", "next", "dist", "bin", "next"),
    "start",
    "-p",
    "3100",
  ],
  {
    cwd: projectRoot,
    env: environment,
    stderr: "inherit",
    stdout: "inherit",
  },
);

try {
  await waitForServer(serverProcess);
  await runCommand([
    nodeExecutable,
    resolve(projectRoot, "node_modules", "@playwright", "test", "cli.js"),
    "test",
    ...process.argv.slice(2),
  ]);
} finally {
  serverProcess.kill();

  const exited = await Promise.race([
    serverProcess.exited.then(() => true),
    Bun.sleep(5_000).then(() => false),
  ]);

  if (!exited) {
    serverProcess.kill(9);
    await serverProcess.exited;
  }
}
