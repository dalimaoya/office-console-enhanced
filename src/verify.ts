import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = Number(process.env.PORT ?? 3015);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, 'data');
const SNAPSHOT_FILE = path.join(DATA_DIR, 'cache-snapshots.json');

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForReady(timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      if (response.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error('adapter did not become ready in time');
}

async function requestJson(pathname: string, init?: RequestInit) {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    ...init,
  });
  const body = await response.json();
  return { status: response.status, body };
}

async function requestText(pathname: string) {
  const response = await fetch(`${BASE_URL}${pathname}`);
  const body = await response.text();
  return { status: response.status, body };
}

function startServer(extraEnv: Record<string, string> = {}) {
  const server = spawn('npm', ['start'], {
    env: { ...process.env, PORT: String(PORT), ...extraEnv },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const stdout: string[] = [];
  const stderr: string[] = [];
  server.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    stdout.push(text);
    process.stdout.write(text);
  });
  server.stderr.on('data', (chunk) => {
    const text = chunk.toString();
    stderr.push(text);
    process.stderr.write(text);
  });

  return { server, stdout, stderr };
}

async function stopServer(server: ReturnType<typeof startServer>['server']) {
  server.kill('SIGTERM');
  await Promise.race([once(server, 'exit'), sleep(3000)]);
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function assertApiFailure(body: any, code: string) {
  assert(body && body.success === false, `expected API failure, got ${JSON.stringify(body)}`);
  assert(body.error?.code === code, `expected error code ${code}, got ${JSON.stringify(body)}`);
}

function assertApiSuccess(body: any) {
  assert(body && body.success === true, `expected API success, got ${JSON.stringify(body)}`);
  assert(typeof body.data === 'object' && body.data !== null, `expected success.data object, got ${JSON.stringify(body)}`);
}

function assertGatewayBoundResponse(response: { status: number; body: any }, allowedErrorCodes: string[] = ['GATEWAY_UNAVAILABLE', 'GATEWAY_TIMEOUT']) {
  if (response.body?.success === true) {
    assert(typeof response.body.cached === 'boolean', `expected cached boolean, got ${JSON.stringify(response.body)}`);
    return 'success';
  }
  assert(response.body?.success === false, `expected success or failure envelope, got ${JSON.stringify(response.body)}`);
  assert(allowedErrorCodes.includes(response.body.error?.code), `expected gateway-bound error code in ${allowedErrorCodes.join(',')}, got ${JSON.stringify(response.body)}`);
  assert([503, 504].includes(response.status), `expected gateway failure HTTP status, got ${response.status}`);
  return 'gateway_error';
}

function withTempTemplates(files: Record<string, string>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'office-dashboard-templates-'));
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, `${name}.yaml`), content);
  }
  return dir;
}

function writeOfflineSnapshots() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const now = Date.now();
  const snapshot = {
    agents: {
      value: {
        items: [
          {
            id: 'agent-backend-leona',
            name: 'backend-leona',
            status: 'warning',
            lastActive: new Date(now - 61_000).toISOString(),
            summaryTags: ['backend', 'available'],
          },
        ],
        total: 1,
      },
      fetchedAt: now - 61_000,
      expiresAt: now - 1_000,
      staleUntil: now + 10 * 60_000,
    },
  };
  fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snapshot, null, 2));
}

function backupFile(filePath: string) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function restoreFile(filePath: string, content: string | null) {
  if (content === null) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

async function runOnlineChecks() {
  const online = startServer();
  try {
    await waitForReady();

    const dashboard = await requestJson('/api/v1/dashboard');
    const dashboardMode = assertGatewayBoundResponse(dashboard);
    if (dashboardMode === 'success') {
      assertApiSuccess(dashboard.body);
      assert(typeof dashboard.body.data.system?.lastCheck === 'string', 'dashboard.system.lastCheck should exist');
      assert(Array.isArray(dashboard.body.data.alerts), 'dashboard.alerts should be an array');
    }

    const health = await requestJson('/api/v1/health');
    const healthMode = assertGatewayBoundResponse(health);
    if (healthMode === 'success') {
      assertApiSuccess(health.body);
      assert(typeof health.body.data.checkedAt === 'string', 'health.checkedAt should exist');
    }

    const templates = await requestJson('/api/v1/config/templates');
    assert(templates.status === 200, `templates should return 200, got ${templates.status}`);
    assertApiSuccess(templates.body);
    assert(Array.isArray(templates.body.data.items), 'templates.items should be an array');
    assert(templates.body.data.items.length >= 1, 'templates.items should not be empty');

    const templateId = templates.body.data.items[0].id;
    const templateDetail = await requestJson(`/api/v1/config/templates/${templateId}`);
    assert(templateDetail.status === 200, `template detail should return 200, got ${templateDetail.status}`);
    assertApiSuccess(templateDetail.body);
    assert(typeof templateDetail.body.data.rawYaml === 'string', 'template rawYaml should exist');

    const agents = await requestJson('/api/v1/agents');
    const agentsMode = assertGatewayBoundResponse(agents);
    if (agentsMode === 'success') {
      assertApiSuccess(agents.body);
      assert(Array.isArray(agents.body.data.items), 'agents.items should be an array');
    }

    // Iter-6：Settings 端点验证
    const settings = await requestJson('/api/v1/settings');
    assert(settings.status === 200, `settings should return 200, got ${settings.status}`);
    assertApiSuccess(settings.body);
    assert(typeof settings.body.data.readonlyMode === 'boolean', 'settings.readonlyMode should be boolean');
    assert(typeof settings.body.data.tokenEnabled === 'boolean', 'settings.tokenEnabled should be boolean');
    assert(typeof settings.body.data.dryRunEnabled === 'boolean', 'settings.dryRunEnabled should be boolean');
    assert(typeof settings.body.data.startedAt === 'string', 'settings.startedAt should be string');

    const applyBadRequest = await requestJson(`/api/v1/config/templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(applyBadRequest.status === 400, `apply without targetAgentId should return 400, got ${applyBadRequest.status}`);
    assertApiFailure(applyBadRequest.body, 'BAD_REQUEST');

    const dashboardPage = await requestText('/dashboard');
    const configPage = await requestText('/config');
    assert(dashboardPage.status === 200 && dashboardPage.body.includes('办公增强控制台'), 'dashboard page HTML should be reachable');
    assert(configPage.status === 200 && configPage.body.includes('办公增强控制台'), 'config page HTML should be reachable');

    return {
      dashboard: dashboard.body.success
        ? { status: dashboard.status, mode: dashboardMode, cached: dashboard.body.cached, stale: dashboard.body.stale ?? false }
        : { status: dashboard.status, mode: dashboardMode, code: dashboard.body.error?.code },
      health: health.body.success
        ? { status: health.status, mode: healthMode, gatewayStatus: health.body.data.gateway?.status }
        : { status: health.status, mode: healthMode, code: health.body.error?.code },
      templates: { status: templates.status, total: templates.body.data.total },
      agents: agents.body.success
        ? { status: agents.status, mode: agentsMode, total: agents.body.data.total }
        : { status: agents.status, mode: agentsMode, code: agents.body.error?.code },
      settings: { status: settings.status, readonlyMode: settings.body.data?.readonlyMode },
      applyBadRequest: { status: applyBadRequest.status, code: applyBadRequest.body.error?.code },
      pages: { dashboard: dashboardPage.status, config: configPage.status },
    };
  } finally {
    await stopServer(online.server);
  }
}

async function runOfflineAgentsStaleCheck() {
  // Iter-1 注：FileReader 启用时，即使 gateway offline 也能从文件直读 agent 数据。
  // 此测试分两个子场景：
  //   (a) USE_FILE_READER=true + MOCK_GATEWAY_MODE=offline → 应返回实时文件数据（cached=false）
  //   (b) USE_FILE_READER=false + MOCK_GATEWAY_MODE=offline → 应返回缓存 stale 数据（cached=true）
  //
  // 场景 (b) 保留原有 fallback 验证；场景 (a) 验证新路径正常工作。

  const backup = backupFile(SNAPSHOT_FILE);
  writeOfflineSnapshots();

  // 场景 (b) 先跑：禁用 FileReader，验证 CLI fallback 的 stale cache 行为
  // （必须先跑，否则场景 a 的文件直读会刷新缓存快照，导致 stale 失效）
  const offlineCliOnly = startServer({ MOCK_GATEWAY_MODE: 'offline', USE_FILE_READER: 'false' });
  let cliStaleResult: Record<string, unknown>;
  try {
    await waitForReady();
    const response = await requestJson('/api/v1/agents');
    assert(response.status === 200, `agents stale (CLI) should return 200, got ${response.status}`);
    assertApiSuccess(response.body);
    assert(response.body.cached === true, `expected cached=true (CLI stale), got ${JSON.stringify(response.body)}`);
    assert(response.body.stale === true, `expected stale=true (CLI stale), got ${JSON.stringify(response.body)}`);
    assert(response.body.warning?.type === 'gateway_unreachable', `expected gateway_unreachable warning, got ${JSON.stringify(response.body)}`);
    cliStaleResult = {
      status: response.status,
      cached: response.body.cached,
      stale: response.body.stale,
      warningType: response.body.warning?.type,
      total: response.body.data?.total,
      mode: 'cli_fallback',
    };
  } finally {
    await stopServer(offlineCliOnly.server);
  }

  // 场景 (a)：FileReader 启用时 offline 也能返回实时数据（不依赖 stale snapshot）
  const offlineWithFileReader = startServer({ MOCK_GATEWAY_MODE: 'offline', USE_FILE_READER: 'true' });
  let fileReaderResult: Record<string, unknown>;
  try {
    await waitForReady();
    const response = await requestJson('/api/v1/agents');
    assert(response.status === 200, `agents (file reader) should return 200, got ${response.status}`);
    assertApiSuccess(response.body);
    // FileReader 路径直接读文件，数据来源不走缓存
    assert(response.body.cached === false, `expected cached=false with FileReader, got ${JSON.stringify(response.body)}`);
    assert(Array.isArray(response.body.data?.items), `expected agents items array, got ${JSON.stringify(response.body)}`);
    assert((response.body.data?.total ?? 0) > 0, `expected at least 1 agent from FileReader, got ${JSON.stringify(response.body)}`);
    fileReaderResult = {
      status: response.status,
      cached: response.body.cached,
      total: response.body.data?.total,
      mode: 'file_reader',
    };
  } finally {
    await stopServer(offlineWithFileReader.server);
    restoreFile(SNAPSHOT_FILE, backup);
  }

  return { fileReaderResult, cliStaleResult };
}

async function runApplyErrorBranchChecks() {
  const validTemplate = `id: office-basic\nname: 基础办公助手\ndescription: 通用办公技能组合\nversion: 1.0.0\ncategory: office\nconfig:\n  model:\n    primary: openai-codex/gpt-5.4\n  skills:\n    - feishu-doc\n`;
  const invalidTemplate = `id: invalid-nonwhitelist\nname: 非法模板\ndescription: 用于验证 TEMPLATE_INVALID\nversion: 1.0.0\ncategory: office\nconfig:\n  workspace: /tmp/should-not-pass\n`;

  const templatesDir = withTempTemplates({ 'office-basic': validTemplate, 'invalid-nonwhitelist': invalidTemplate });

  const agentNotFoundServer = startServer({ TEMPLATES_DIR: templatesDir });
  try {
    await waitForReady();
    const agentNotFound = await requestJson('/api/v1/config/templates/office-basic/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAgentId: 'agent-not-exists-for-qa' }),
    });
    assert(agentNotFound.status === 404, `AGENT_NOT_FOUND should return 404, got ${agentNotFound.status}`);
    assertApiFailure(agentNotFound.body, 'AGENT_NOT_FOUND');

    const invalidTemplateResponse = await requestJson('/api/v1/config/templates/invalid-nonwhitelist/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetAgentId: 'agent-backend-leona' }),
    });
    assert(invalidTemplateResponse.status === 422, `TEMPLATE_INVALID should return 422, got ${invalidTemplateResponse.status}`);
    assertApiFailure(invalidTemplateResponse.body, 'TEMPLATE_INVALID');

    await stopServer(agentNotFoundServer.server);

    const applyFailedServer = startServer({ TEMPLATES_DIR: templatesDir, MOCK_CONFIG_APPLY_FAILURE: 'verify-hook' });
    try {
      await waitForReady();
      const applyFailed = await requestJson('/api/v1/config/templates/office-basic/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // dryRun=false triggers actual apply path (Iter-2: dry-run is default)
        body: JSON.stringify({ targetAgentId: 'agent-backend-leona', dryRun: false }),
      });
      assert(applyFailed.status === 500, `TEMPLATE_APPLY_FAILED should return 500, got ${applyFailed.status}`);
      assertApiFailure(applyFailed.body, 'TEMPLATE_APPLY_FAILED');
      return {
        agentNotFound: { status: agentNotFound.status, code: agentNotFound.body.error?.code },
        templateInvalid: { status: invalidTemplateResponse.status, code: invalidTemplateResponse.body.error?.code },
        templateApplyFailed: { status: applyFailed.status, code: applyFailed.body.error?.code, detail: applyFailed.body.error?.detail },
      };
    } finally {
      await stopServer(applyFailedServer.server);
    }
  } finally {
    if (agentNotFoundServer.server.exitCode === null) {
      await stopServer(agentNotFoundServer.server);
    }
    fs.rmSync(templatesDir, { recursive: true, force: true });
  }
}

async function main() {
  const onlineSummary = await runOnlineChecks();
  const agentsStaleSummary = await runOfflineAgentsStaleCheck();
  const applyErrorSummary = await runApplyErrorBranchChecks();

  console.log('\nVerification summary');
  console.log(JSON.stringify({
    onlineSummary,
    agentsStaleSummary,
    applyErrorSummary,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
