import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { performance } from 'node:perf_hooks';

const PORT = Number(process.env.PORT ?? 3014);
const URL = `http://127.0.0.1:${PORT}/api/v1/dashboard`;

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReady(timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(300);
  }
  throw new Error('adapter did not become ready in time');
}

async function timedRequest() {
  const started = performance.now();
  const response = await fetch(URL, {
    headers: {
      Accept: 'application/json',
    },
  });
  const body = await response.json();
  return {
    status: response.status,
    durationMs: performance.now() - started,
    cached: body.cached,
    stale: body.stale,
  };
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index] ?? 0;
}

async function main() {
  const server = spawn('npm', ['start'], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(chunk));
  server.stderr.on('data', (chunk) => process.stderr.write(chunk));

  try {
    await waitForReady();
    await sleep(1000);

    const cold = await timedRequest();
    const warmRuns = [] as Awaited<ReturnType<typeof timedRequest>>[];
    for (let i = 0; i < 12; i += 1) {
      warmRuns.push(await timedRequest());
      await sleep(200);
    }

    const warmDurations = warmRuns.map((item) => item.durationMs);
    const hitRate = warmRuns.filter((item) => item.cached).length / warmRuns.length;

    console.log('\nBenchmark summary');
    console.log(JSON.stringify({
      cold,
      warm: {
        count: warmRuns.length,
        avgMs: Number((warmDurations.reduce((sum, value) => sum + value, 0) / warmDurations.length).toFixed(2)),
        p95Ms: Number(percentile(warmDurations, 95).toFixed(2)),
        maxMs: Number(Math.max(...warmDurations).toFixed(2)),
        cacheHitRate: Number((hitRate * 100).toFixed(2)),
      },
    }, null, 2));
  } finally {
    server.kill('SIGTERM');
    await Promise.race([once(server, 'exit'), sleep(3000)]);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
