#!/bin/bash
# ============================================================
# OpenClaw 办公控制台卸载脚本
# 功能：停止服务 → 清理 node_modules
# ============================================================

# ---- 颜色定义 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "  ${BLUE}ℹ️  $1${NC}"; }
step() { echo -e "\n${BOLD}==> $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo ".")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "\n${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   OpenClaw 办公控制台 — 卸载脚本         ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}\n"

warn "此操作将停止服务并清理依赖目录（node_modules）。"
warn ".env 配置文件和源代码不会被删除。"
echo ""
read -r -p "  确认继续？(y/N): " CONFIRM
CONFIRM="${CONFIRM:-N}"

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  info "已取消卸载。"
  exit 0
fi

# ============================================================
# 第一步：停止 PM2 服务
# ============================================================
step "第一步：停止 PM2 服务"

if command -v pm2 &>/dev/null; then
  # 尝试停止 office-console 进程
  if pm2 list 2>/dev/null | grep -q "office-console"; then
    pm2 stop office-console 2>/dev/null && ok "PM2 进程 office-console 已停止"
    pm2 delete office-console 2>/dev/null && ok "PM2 进程 office-console 已从列表移除"
  else
    info "PM2 中未发现 office-console 进程，跳过"
  fi
else
  info "未安装 PM2，跳过"
fi

# ============================================================
# 第二步：杀死占用端口的进程（端口来自 .env 或默认 3014）
# ============================================================
step "第二步：停止端口占用进程"

CONFIGURED_PORT="3014"
ENV_FILE="$PROJECT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
  ENV_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d ' ')
  [ -n "$ENV_PORT" ] && CONFIGURED_PORT="$ENV_PORT"
fi

info "检查端口 ${CONFIGURED_PORT}..."

PORT_PID=""
if command -v lsof &>/dev/null; then
  PORT_PID=$(lsof -t -i ":${CONFIGURED_PORT}" -sTCP:LISTEN 2>/dev/null | head -1)
elif command -v ss &>/dev/null; then
  PORT_PID=$(ss -tlnp 2>/dev/null | grep ":${CONFIGURED_PORT} " | grep -oP 'pid=\K[0-9]+' | head -1)
fi

if [ -n "$PORT_PID" ]; then
  PROC_NAME=$(ps -p "$PORT_PID" -o comm= 2>/dev/null || echo "PID=$PORT_PID")
  info "发现进程占用端口 ${CONFIGURED_PORT}：${PROC_NAME}（PID=${PORT_PID}）"
  kill "$PORT_PID" 2>/dev/null && ok "进程 ${PORT_PID} 已终止" || warn "无法终止进程 ${PORT_PID}，请手动处理"
else
  info "端口 ${CONFIGURED_PORT} 无进程占用，跳过"
fi

# ============================================================
# 第三步：清理 node_modules
# ============================================================
step "第三步：清理 node_modules"

NM_DIR="$PROJECT_DIR/node_modules"
if [ -d "$NM_DIR" ]; then
  info "正在删除：$NM_DIR"
  rm -rf "$NM_DIR"
  ok "node_modules 已清理"
else
  info "node_modules 不存在，跳过"
fi

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo -e "  ${GREEN}${BOLD}✅ 卸载完成${NC}"
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo ""
info "以下内容已保留（未删除）："
echo -e "    - 源代码（src/）"
echo -e "    - 配置文件（.env、package.json）"
echo -e "    - 数据目录（data/）"
echo ""
info "如需重新安装："
echo -e "    npm run install-local   # 引导式安装"
echo -e "    npm install && npm start  # 直接安装启动"
echo ""
