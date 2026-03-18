#!/bin/bash
# ============================================================
# OpenClaw 办公控制台一键安装脚本
# 功能：检查环境 → 安装依赖 → 配置 .env → 启动服务
# 支持：Linux（优先）
# ============================================================

set -e

# ---- 颜色定义 ----
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ---- 工具函数 ----
ok()   { echo -e "  ${GREEN}✅ $1${NC}"; }
err()  { echo -e "  ${RED}❌ $1${NC}"; }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; }
info() { echo -e "  ${BLUE}ℹ️  $1${NC}"; }
step() { echo -e "\n${BOLD}==> $1${NC}"; }

banner() {
  echo -e "${BOLD}"
  echo "  ╔══════════════════════════════════════════╗"
  echo "  ║   OpenClaw 办公控制台 — 一键安装脚本     ║"
  echo "  ║   office-dashboard-adapter               ║"
  echo "  ╚══════════════════════════════════════════╝"
  echo -e "${NC}"
}

# ---- 确定脚本所在目录（兼容远程管道执行） ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo ".")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ---- 开始安装 ----
banner

# ============================================================
# 第一步：环境检查
# ============================================================
step "第一步：环境检查"

CHECKS_PASSED=true

# 检查 Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -e "process.stdout.write(process.version.slice(1))")
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 18 ]; then
    ok "Node.js v${NODE_VER}（>= 18 ✓）"
  else
    err "Node.js v${NODE_VER} 版本过低，需要 >= 18"
    info "升级命令（nvm）：nvm install 18 && nvm use 18"
    CHECKS_PASSED=false
  fi
else
  err "未找到 Node.js，请先安装（https://nodejs.org/ 或 nvm）"
  CHECKS_PASSED=false
fi

# 检查 npm
if command -v npm &>/dev/null; then
  NPM_VER=$(npm --version)
  ok "npm v${NPM_VER}"
else
  err "未找到 npm，通常随 Node.js 一起安装"
  CHECKS_PASSED=false
fi

# 检查 openclaw
if command -v openclaw &>/dev/null; then
  OC_VER=$(openclaw --version 2>/dev/null || echo "已安装")
  ok "openclaw ${OC_VER}"
else
  warn "openclaw 未找到（可选，但 Gateway 功能依赖它）"
  info "安装命令：npm install -g openclaw"
fi

if [ "$CHECKS_PASSED" = false ]; then
  echo ""
  err "环境检查未通过，请先解决上述问题后重试。"
  exit 1
fi

# ============================================================
# 第二步：进入项目目录
# ============================================================
step "第二步：确认项目目录"

# 如果是远程执行（curl | bash），PROJECT_DIR 可能不正确
if [ ! -f "$PROJECT_DIR/package.json" ]; then
  # 尝试当前目录
  if [ -f "$(pwd)/package.json" ]; then
    PROJECT_DIR="$(pwd)"
  else
    warn "未能自动定位 package.json，尝试从 GitHub 克隆..."
    REPO_URL="https://github.com/dalimaoya/office-console-enhanced"
    CLONE_DIR="$HOME/office-console-enhanced"
    if command -v git &>/dev/null; then
      if [ -d "$CLONE_DIR" ]; then
        info "目录已存在，执行 git pull..."
        git -C "$CLONE_DIR" pull
      else
        git clone "$REPO_URL" "$CLONE_DIR"
      fi
      PROJECT_DIR="$CLONE_DIR/artifacts/office-dashboard-adapter"
    else
      err "未找到 git，无法自动克隆。请手动克隆仓库后再运行此脚本。"
      exit 1
    fi
  fi
fi

info "项目目录：$PROJECT_DIR"
cd "$PROJECT_DIR"

# ============================================================
# 第三步：安装依赖
# ============================================================
step "第三步：安装 npm 依赖"

npm install
ok "依赖安装完成"

# ============================================================
# 第四步：配置 .env
# ============================================================
step "第四步：配置环境变量（.env）"

ENV_FILE="$PROJECT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  ok ".env 文件已存在，跳过配置向导"
  info "如需修改配置，请编辑：$ENV_FILE"
else
  warn ".env 文件不存在，启动配置向导..."
  echo ""

  # 读取 PORT
  read -r -p "  请输入服务端口 [默认: 3014]: " INPUT_PORT
  PORT="${INPUT_PORT:-3014}"

  # 读取 READONLY_MODE
  read -r -p "  是否启用只读模式（只读模式下禁止写入操作）[默认: true] (true/false): " INPUT_READONLY
  READONLY_MODE="${INPUT_READONLY:-true}"

  # 写入 .env
  cat > "$ENV_FILE" <<EOF
# OpenClaw 办公控制台环境配置
# 生成时间：$(date -u +"%Y-%m-%d %H:%M:%S UTC")

PORT=${PORT}
READONLY_MODE=${READONLY_MODE}

# Gateway WebSocket 地址（通常无需修改）
GATEWAY_WS_URL=ws://127.0.0.1:18789

# 日志级别：debug | info | warn | error
LOG_LEVEL=info
EOF

  ok ".env 文件已生成：$ENV_FILE"
fi

# ============================================================
# 第五步：启动服务
# ============================================================
step "第五步：启动服务"

# 读取端口配置（用于显示）
if [ -f "$ENV_FILE" ]; then
  DISPLAY_PORT=$(grep -E '^PORT=' "$ENV_FILE" | cut -d= -f2 | tr -d ' ' || echo "3014")
else
  DISPLAY_PORT="3014"
fi

echo ""
echo -e "  请选择启动方式："
echo -e "  ${BOLD}1)${NC} PM2 守护进程（推荐，支持自动重启）"
echo -e "  ${BOLD}2)${NC} 直接启动（前台运行，Ctrl+C 退出）"
echo -e "  ${BOLD}3)${NC} 跳过启动（手动启动）"
echo ""
read -r -p "  请输入选项 [默认: 1]: " LAUNCH_CHOICE
LAUNCH_CHOICE="${LAUNCH_CHOICE:-1}"

case "$LAUNCH_CHOICE" in
  1)
    if command -v pm2 &>/dev/null; then
      info "使用 PM2 启动..."
      npm run start:pm2 2>/dev/null || pm2 start npm --name "office-console" -- start
      ok "PM2 守护进程已启动"
      info "查看日志：pm2 logs office-console"
      info "停止服务：pm2 stop office-console"
    else
      warn "未找到 PM2，尝试全局安装..."
      npm install -g pm2
      npm run start:pm2 2>/dev/null || pm2 start npm --name "office-console" -- start
      ok "PM2 守护进程已启动"
    fi
    ;;
  2)
    info "前台启动服务..."
    echo -e "\n${YELLOW}  按 Ctrl+C 可停止服务${NC}\n"
    npm start
    ;;
  3)
    warn "已跳过自动启动"
    info "手动启动命令："
    echo -e "    cd $PROJECT_DIR"
    echo -e "    npm start          # 前台启动"
    echo -e "    npm run start:pm2  # PM2 守护进程"
    ;;
  *)
    warn "无效选项，跳过启动"
    ;;
esac

# ============================================================
# 完成
# ============================================================
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║           🎉 安装完成！                  ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "  ${BOLD}访问地址：${NC}"
echo -e "    http://localhost:${DISPLAY_PORT}"
echo -e "    http://localhost:${DISPLAY_PORT}/api/v1/health"
echo -e "    http://localhost:${DISPLAY_PORT}/api/v1/dashboard"
echo ""
echo -e "  ${BOLD}常用命令：${NC}"
echo -e "    npm run diagnose     # 运行环境诊断"
echo -e "    npm start            # 前台启动"
echo -e "    npm run start:pm2    # PM2 启动"
echo ""
