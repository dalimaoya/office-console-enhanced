# 2026-03-19 UI 低优先级修复记录（Batch 3 / Ezreal）

- 时间：2026-03-19 UTC
- 角色：frontend-ezreal
- 范围：`src/public/index.html` / `src/public/style.css` / `src/public/app.js`

## 修复清单

| 编号 | 项目 | 结果 | 说明 |
|---|---|---|---|
| L1 | 清理重复 `@keyframes spin` | 完成 | 复查样式后仅保留单一 `@keyframes spin` 定义，确认无重复残留。 |
| L2 | 关键字号纳入字体 token | 完成 | 新增 `--font-size-kpi`、`--font-size-page-title`，并替换 KPI/页面标题等关键字号使用。 |
| L3 | 修复 `--ease-fast` 命名语义 | 完成 | 将 `--ease-fast` 收敛为 easing curve，补充 `--transition-fast` / `--transition-base`，主要使用处改为 transition token。 |
| L4 | 小组件圆角收口 | 完成 | 将 `.segment-item`、`.pie-legend-dot`、兼容按钮别名等小组件圆角收敛到 `--radius-sm` / `--radius-xs`。 |
| L5 | 清理 `--text-active` alias of alias | 完成 | `--text-active` 改为直接指向最终色值，减少 alias 链。 |
| L6 | 加载超时与失败提示 | 完成 | `apiFetch` 增加 5 秒超时；总览区增加超时/失败文案，分别提示“加载超时，请点击刷新”“数据获取失败，请检查服务状态”。 |
| L7 | 导航图标从 emoji 替换 | 完成 | 侧栏导航改为统一 Unicode 符号，减少跨平台 emoji 差异。 |
| L8 | 协作页内部术语办公化 | 完成 | 将 `Subagent`、`Parent Session` 等改为“子任务（Subagent）”“主会话（Parent Session）”“工作会话详情”等办公表达。 |
| L9 | 文档页空态引导 | 完成 | 新增空态容器、说明文案与刷新入口；渲染逻辑支持空列表时展示引导。 |
| L10 | 用量页时间段切换反馈 | 完成 | 切换按钮增加显著选中态，并在切换期间增加 loading/禁用反馈。 |

## 备注

- 本批 10/10 完成，无跳过项。
- 已做脚本语法检查：`node --check src/public/app.js` 通过。
- 当前为前端静态文件改动，服务联调状态待 QA/浏览器回归确认。
