import { spawn } from "node:child_process";

const children = [];
let shuttingDown = false;

const services = [
  {
    name: "quote-service",
    command: "python3",
    args: [
      "-m",
      "uvicorn",
      "quote_service:app",
      "--app-dir",
      "python-quote-service",
      "--host",
      "0.0.0.0",
      "--port",
      "8001"
    ],
    readyUrl: "http://127.0.0.1:8001/health",
    readyLabel: "quote service",
    env: {
      PYTHONUNBUFFERED: "1"
    }
  },
  {
    name: "backend",
    command: "node",
    args: ["backend/dist/server.js"],
    readyUrl: "http://127.0.0.1:4000/api/health",
    readyLabel: "backend",
    env: {
      NODE_ENV: "production",
      BACKEND_HOST: "127.0.0.1",
      STOCK_QUOTE_SERVICE_URL: "http://127.0.0.1:8001"
    }
  },
  {
    name: "frontend",
    command: "npm",
    args: [
      "--workspace",
      "frontend",
      "run",
      "start",
      "--",
      "--hostname",
      "0.0.0.0",
      "--port",
      "8080"
    ],
    readyUrl: "http://127.0.0.1:8080/",
    readyLabel: "frontend",
    env: {
      NODE_ENV: "production",
      BACKEND_INTERNAL_URL: "http://127.0.0.1:4000"
    }
  }
];

function start(service) {
  const child = spawn(service.command, service.args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...service.env
    }
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    console.error(`${service.name} exited with code ${code ?? "null"} signal ${signal ?? "null"}`);
    shutdown(code ?? (signal ? 1 : 0));
  });

  children.push(child);
  return child;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, label, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep waiting
    }

    await delay(1000);
  }

  throw new Error(`Timed out waiting for ${label} at ${url}`);
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

for (const service of services) {
  start(service);
  await waitForHttp(service.readyUrl, service.readyLabel);
}
