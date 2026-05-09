import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

function start(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv
    }
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`${name} exited with code ${code ?? "null"} signal ${signal ?? "null"}`);
    shutdown(code ?? (signal ? 1 : 0));
  });

  children.push(child);
  return child;
}

function shutdown(exitCode = 0) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill("SIGTERM");
  }

  setTimeout(() => {
    for (const child of children) {
      child.kill("SIGKILL");
    }
    process.exit(exitCode);
  }, 10_000).unref();
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("quote-service", "python3", [
  "-m",
  "uvicorn",
  "quote_service:app",
  "--app-dir",
  "python-quote-service",
  "--host",
  "0.0.0.0",
  "--port",
  "8001"
]);

start("backend", "node", [
  "backend/dist/server.js"
], {
  NODE_ENV: "production",
  BACKEND_HOST: "127.0.0.1",
  STOCK_QUOTE_SERVICE_URL: "http://127.0.0.1:8001"
});

start("frontend", "npm", [
  "--workspace",
  "frontend",
  "run",
  "start",
  "--",
  "--hostname",
  "0.0.0.0",
  "--port",
  "8080"
], {
  NODE_ENV: "production",
  BACKEND_INTERNAL_URL: "http://127.0.0.1:4000"
});
