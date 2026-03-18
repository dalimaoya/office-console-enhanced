#!/bin/bash
# ============================================================
# OpenClaw 办公控制台环境诊断脚本
# 支持：Linux / macOS
# ============================================================

# ---- 颜色定义 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ---- 工具函数 ----
ok()    { echo -e "  ${GREEN}✅ $1${NC}"; }
fail()  { echo -e "  ${RED}❌ $1${NC}"; }
warn()  { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
info()  { echo -e "  ${BLUE}ℹ️  $1${NC}"; }
section() { echo -e "\n${BOLD}${CYAN}── $1 ──${NC}"; }

# ---- 确定项目目录 ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo ".")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"

ISSUES=0

echo -e "\n${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   OpenClaw 办公控制台 — 环境诊断报告     ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo -e "  诊断时间：$(date '+%Y-%m-%d %H:%M:%S %Z')"
echo -e "  主机名称：$(hostname)"
echo -e "  操作系统：$(uname -s) $(uname -r)"

# ============================================================
# 1. Node.js
# ============================================================
section "Node.js"
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.version.slice(1))" 2>/dev/null)
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  NODE_PATH=$(command -v node)
  if [ -n "$NODE_MAJOR" ] && [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js v${NODE_VER}（>= 18）  路径：${NODE_PATH}"
  else
    fail "Node.js v${NODE_VER} 版本过低（需要 >= 18）  路径：${NODE_PATH}"
    ISSUES=$((ISSUES + 1))
  fi
else
  fail "Node.js 未安装"
  info "安装方式：https://nodejs.org/ 或 nvm install 18"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 2. npm
# ============================================================
section "npm"
if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version 2>/dev/null)
  NPM_PATH=$(command -v npm)
  ok "npm v${NPM_VER}  路径：${NPM_PATH}"
else
  fail "npm 未安装（通常随 Node.js 一起安装）"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 3. openclaw
# ============================================================
section "openclaw"
if command -v openclaw &>/dev/null; then
  OC_PATH=$(command -v openclaw)
  OC_VER=$(openclaw --version 2>/dev/null || echo "（版本未知）")
  ok "openclaw 已安装  版本：${OC_VER}  路径：${OC_PATH}"
else
  warn "openclaw 未安装（Gateway 功能依赖它）"
  info "安装命令：npm install -g openclaw"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 4. Gateway 运行状态（ws://127.0.0.1:18789）
# ============================================================
section "Gateway 运行状态"
GW_HOST="127.0.0.1"
GW_PORT="18789"

# 优先用 nc / curl 检测 TCP 连通性
GW_OK=false
if command -v nc &>/dev/null; then
  if nc -z -w2 "$GW_HOST" "$GW_PORT" 2>/dev/null; then
    GW_OK=true
  fi
elif command -v curl &>/dev/null; then
  # HTTP health 探测（Gateway 通常同时暴露 HTTP）
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://${GW_HOST}:${GW_PORT}/health" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" != "000" ]; then
    GW_OK=true
  fi
elif command -v python3 &>/dev/null; then
  python3 -c "
import socket, sys
s = socket.socket()
s.settimeout(2)
try:
  s.connect(('$GW_HOST', $GW_PORT))
  s.close()
  sys.exit(0)
except:
  sys.exit(1)
" 2>/dev/null && GW_OK=true
fi

if $GW_OK; then
  ok "Gateway 可达（ws://${GW_HOST}:${GW_PORT}）"
else
  warn "Gateway 不可达（ws://${GW_HOST}:${GW_PORT}）"
  info "启动命令：openclaw gateway start"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 5. 端口 3014 占用情况
# ============================================================
section "端口 3014 占用"
# 读取 .env 中配置的端口（如果存在）
CONFIGURED_PORT="3014"
if [ -f "$ENV_FILE" ]; then
  ENV_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d ' ')
  [ -n "$ENV_PORT" ] && CONFIGURED_PORT="$ENV_PORT"
fi

check_port_in_use() {
  local port="$1"
  if command -v ss &>/dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":${port} " && return 0
  fi
  if command -v netstat &>/dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":${port} " && return 0
  fi
  if command -v lsof &>/dev/null; then
    lsof -i ":${port}" -sTCP:LISTEN &>/dev/null && return 0
  fi
  return 1
}

if check_port_in_use "$CONFIGURED_PORT"; then
  # 尝试获取占用进程名
  PORT_PROC=""
  if command -v ss &>/dev/null; then
    PORT_PROC=$(ss -tlnp 2>/dev/null | grep ":${CONFIGURED_PORT} " | grep -oP 'pid=\K[0-9]+' | head -1)
    [ -n "$PORT_PROC" ] && PORT_PROC=$(ps -p "$PORT_PROC" -o comm= 2>/dev/null || echo "PID=$PORT_PROC")
  fi
  if [ -n "$PORT_PROC" ]; then
    ok "端口 ${CONFIGURED_PORT} 已占用 → 进程：${PORT_PROC}（服务可能已在运行）"
  else
    ok "端口 ${CONFIGURED_PORT} 已占用（服务可能已在运行）"
  fi
else
  info "端口 ${CONFIGURED_PORT} 空闲（服务未运行或使用其他端口）"
fi

# ============================================================
# 6. .env 配置
# ============================================================
section ".env 配置"
if [ -f "$ENV_FILE" ]; then
  ok ".env 文件存在：${ENV_FILE}"
  # 检查关键变量
  check_env_var() {
    local key="$1"
    local val
    val=$(grep -E "^${key}=" "$ENV_FILE" | cut -d= -f2- | tr -d ' ')
    if [ -n "$val" ]; then
      ok "  ${key} = ${val}"
    else
      warn "  ${key} 未设置"
      ISSUES=$((ISSUES + 1))
    fi
  }
  check_env_var "PORT"
  check_env_var "READONLY_MODE"
  # 可选变量（不影响 ISSUES 计数）
  for KEY in GATEWAY_WS_URL LOG_LEVEL; do
    val=$(grep -E "^${KEY}=" "$ENV_FILE" | cut -d= -f2- | tr -d ' ')
    if [ -n "$val" ]; then
      info "  ${KEY} = ${val}"
    else
      info "  ${KEY} 未设置（使用默认值）"
    fi
  done
else
  warn ".env 文件不存在（${ENV_FILE}）"
  info "运行 npm run install-local 可生成 .env 模板"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 7. 磁盘空间
# ============================================================
section "磁盘空间（项目目录）"
if [ -d "$PROJECT_DIR" ]; then
  # 获取项目目录所在分区的剩余空间
  DISK_AVAIL=""
  DISK_USED=""
  if command -v df &>/dev/null; then
    DISK_INFO=$(df -h "$PROJECT_DIR" 2>/dev/null | tail -1)
    if [ -n "$DISK_INFO" ]; then
      DISK_AVAIL=$(echo "$DISK_INFO" | awk '{print $4}')
      DISK_USED=$(echo "$DISK_INFO" | awk '{print $5}')
      DISK_MOUNT=$(echo "$DISK_INFO" | awk '{print $6}')
    fi
  fi
  # 项目目录大小
  DIR_SIZE=""
  if command -v du &>/dev/null; then
    DIR_SIZE=$(du -sh "$PROJECT_DIR" 2>/dev/null | awk '{print $1}')
  fi
  ok "项目目录：${PROJECT_DIR}"
  [ -n "$DIR_SIZE" ]    && info "  目录大小：${DIR_SIZE}"
  [ -n "$DISK_AVAIL" ]  && info "  分区剩余：${DISK_AVAIL}（挂载点：${DISK_MOUNT}，已用：${DISK_USED}）"

  # 警告：可用空间 < 500MB（粗略判断，单位可能为 G/M/K）
  AVAIL_NUM=$(echo "$DISK_AVAIL" | grep -oP '[0-9.]+')
  AVAIL_UNIT=$(echo "$DISK_AVAIL" | grep -oP '[A-Za-z]+')
  if [ -n "$AVAIL_NUM" ] && [ -n "$AVAIL_UNIT" ]; then
    case "$AVAIL_UNIT" in
      M|MB)
        if (( $(echo "$AVAIL_NUM < 500" | bc -l 2>/dev/null || echo 0) )); then
          warn "  磁盘剩余空间较少（< 500MB），建议清理"
          ISSUES=$((ISSUES + 1))
        fi
        ;;
      K|KB)
        warn "  磁盘剩余空间严重不足（${DISK_AVAIL}），请立即清理！"
        ISSUES=$((ISSUES + 1))
        ;;
      *)
        : # G/T 等情况不警告
        ;;
    esac
  fi
else
  fail "项目目录不存在：${PROJECT_DIR}"
  ISSUES=$((ISSUES + 1))
fi

# ============================================================
# 总结
# ============================================================
echo ""
echo -e "${BOLD}══════════════════════════════════════════${NC}"
if [ "$ISSUES" -eq 0 ]; then
  echo -e "  ${GREEN}${BOLD}🎉 诊断通过！环境配置正常，无问题项。${NC}"
elif [ "$ISSUES" -le 2 ]; then
  echo -e "  ${YELLOW}${BOLD}⚠️  发现 ${ISSUES} 个警告，建议处理后再使用。${NC}"
else
  echo -e "  ${RED}${BOLD}❌ 发现 ${ISSUES} 个问题，请先修复后再启动服务。${NC}"
fi
echo -e "${BOLD}══════════════════════════════════════════${NC}"
echo ""
exit "$ISSUES"
