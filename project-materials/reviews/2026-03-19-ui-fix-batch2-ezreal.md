# 2026-03-19 UI/体验修复批次 2（Ezreal）

- 时间：2026-03-19 UTC
- 角色：frontend-ezreal
- 范围：office-dashboard-adapter `src/public/`

## 修复结果总览
- 高优先级：6/6 完成
- 中优先级：10/10 完成
- 跳过：0 条
- 服务状态：本地常见 HTTP 端口（3000/3001/5173/8080/8787）未发现在线服务，未做浏览器联调

## 逐条记录

### 高优先级
1. **H1 — CSS 加载顺序修复**：完成  
   - `index.html` 已调整为 `tokens.css` 在前、`style.css` 在后。

2. **H2 — 清理旧版 styles.css**：完成  
   - 发现旧版 `styles.css`，当前目录无有效引用。  
   - 已重命名为 `styles.css.bak`，避免误引用。

3. **H3 — 状态色 token 收口**：完成  
   - `style.css` 中确认保留 `--color-success / --color-warning / --color-error / --color-offline`。  
   - 多处成功/警告/错误/离线色已改为 token 或基于 token 的 `color-mix(...)`。

4. **H4 — 整体只读模式提示**：完成  
   - 顶栏只读 pill 改为说明性文案，并补充 tooltip。  
   - “新建任务”输入框/按钮在只读模式下禁用并给出 tooltip。  
   - 补充 `POST /api/v1/tasks` 前端入口；读写模式可恢复创建动作。

5. **H5 — 演示数据标注**：完成  
   - 总览区新增演示数据横幅。  
   - KPI 下增加趋势/静态数据提示。  
   - 协作区 mock fallback 文案改为“演示数据”。

6. **H6 — 导航语义化**：完成  
   - 导航已改为办公语义：`协作 -> 多智能体协作`、`用量 -> 用量统计`、`记忆 -> 知识库`、`文档 -> 工作文档`、`设置 -> 系统设置`，并同步路由标题。

### 中优先级
1. **M1 — 卡片圆角统一**：完成  
   - 主面板/卡片圆角统一向 `--radius-lg / --radius-xl` 收敛，并将 token 调整到 16/20px 体系。

2. **M2 — Inspector Sidebar 布局修复**：完成  
   - `inspector-sidebar` 由 fixed 改为 grid/sticky 占位；收起时通过 `.shell.inspector-hidden` 释放布局空间。  
   - 浮动折叠入口保留，但不再依赖 fixed 侧栏本体占位。

3. **M3 — 卡片 padding 统一**：完成  
   - 多处主要卡片/面板 padding 改为 `var(--space-md)` / `var(--space-lg)`。

4. **M4 — 导航 active 态**：完成  
   - 去掉 `border-left + padding` 补偿；改为 `::before` 左侧高亮条，避免文字抖动。

5. **M5 — Topbar 信息层级**：完成  
   - 顶栏保留连接状态、只读状态、搜索、刷新按钮。  
   - 刷新耗时与 cache 状态折叠隐藏，降低窄屏折行风险。

6. **M6 — 刷新按钮改名**：完成  
   - “强制重新加载”统一改为“刷新数据”，保留 tooltip 说明可绕过缓存。

7. **M7 — 快捷键双平台提示**：完成  
   - UI 改为 `Ctrl/⌘ K`；并增加平台感知 title 文案。

8. **M8 — 任务页视图清理**：完成  
   - 保留“列表 / 看板”双视图。  
   - 清理旧文案，统一为任务列表与看板切换，避免第三套废弃视图语义残留。

9. **M9 — KPI 趋势标注**：完成  
   - 5 个 KPI 卡片均增加趋势/说明行；真实趋势缺失处明确标注静态演示数据。

10. **M10 — Inspector 折叠入口优化**：完成  
   - 折叠入口放大为悬浮按钮，增加“待处理/工作提示”文案与角标数量。

## 影响文件
- `/root/.openclaw/workspace/projects/office-console-enhanced/artifacts/office-dashboard-adapter/src/public/index.html`
- `/root/.openclaw/workspace/projects/office-console-enhanced/artifacts/office-dashboard-adapter/src/public/style.css`
- `/root/.openclaw/workspace/projects/office-console-enhanced/artifacts/office-dashboard-adapter/src/public/app.js`
- `/root/.openclaw/workspace/projects/office-console-enhanced/artifacts/office-dashboard-adapter/src/public/styles.css.bak`

## 备注
- 已通过 `node -c app.js` 做语法检查。  
- 当前环境未探测到本地在线 HTTP 服务，因此未执行浏览器级动态回归；建议加里奥联调时重点复核只读切换、Inspector 收起/展开、任务创建入口与任务视图切换。
