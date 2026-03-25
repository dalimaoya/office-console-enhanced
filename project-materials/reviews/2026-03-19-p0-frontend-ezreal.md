# 前端 P0 修复记录（Ezreal）

- 时间：2026-03-19 UTC
- 角色：frontend-ezreal
- 范围：Connection Health 引导卡 + Timeline 视图

## 完成项

### 1. Connection Health 引导卡
- 在 Overview 页 hero-stage 下方新增 `#connection-health-card`
- 基于 `/api/v1/settings/wiring-status` 动态判断接线状态
- 当 Gateway / 飞书存在 `error` / `warn` 时显示业务化提示文案
- 初始化时加载，并增加 60s 定时刷新
- 进入 Settings 刷新接线状态后会同步更新该引导卡

### 2. Timeline 视图
- 新增左侧导航入口“时间线”
- 新增 `timeline-page` 页面结构
- 新增类型筛选与刷新按钮
- 前端通过 `/api/v1/timeline?limit=50&type=...` 拉取最近 50 条系统事件
- 路由切换到 `timeline` 时自动加载数据
- 补充时间线列表样式、空态与错误态展示

## 修改文件
- `artifacts/office-dashboard-adapter/src/public/index.html`
- `artifacts/office-dashboard-adapter/src/public/app.js`
- `artifacts/office-dashboard-adapter/src/public/style.css`

## 验证
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3014/`
- 结果：`200`

## 备注
- Timeline 视图对接口返回结构做了兼容处理，支持 `payload.data.events` 和直接数组两种形式
- Connection Health 兼容 `checks` 数组与 `gateway/feishu` 扁平结构
