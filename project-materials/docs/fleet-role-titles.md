# 航海舰队 — 权威职称对照表（Canonical Role Titles）

> **维护者**：Jax（architect-jax）  
> **日期**：2026-03-20  
> **状态**：正式生效  
> **用途**：所有舰队文档引用英文职称时，以本表为唯一权威来源（Single Source of Truth）

---

## 职称对照表

| 角色 | 技术角色 | 中文职称 | 英文职称 | 故事线命名示例 |
|------|----------|----------|----------|---------------|
| 提莫（总控） | orchestrator | 指挥官 | Commander | `morning-star-commander` |
| 艾克（产品） | pm | 领航员 | Navigator | `morning-star-navigator` |
| 贾克斯（架构） | architect | 船匠 | Shipwright | `morning-star-shipwright` |
| 伊泽瑞尔（前端） | frontend | 帆手 | Sailmaster | `morning-star-sailmaster` |
| 雷欧娜（后端） | backend | 轮机长 | Engineer | `morning-star-engineer` |
| 加里奥（QA） | qa | 瞭望员 | Lookout | `morning-star-lookout` |
| 拉克丝（UI） | design | 海图师 | Chartmaker | `morning-star-chartmaker` |
| 杰斯（办公） | aioffice | 补给官 | Quartermaster | `morning-star-quartermaster` |
| 瑞兹（运维/顾问） | devops | 灯塔守望者 | Keeper | `morning-star-keeper` |

## 命名规则

- **故事线命名格式**：`{船队slug}-{英文职称小写}` → 如 `morning-star-navigator`
- **船队 slug**：小写 kebab-case，全局唯一 → 如 `morning-star`
- **一岗多人后缀**：`{船队slug}-{职称}-{专长/序号}` → 如 `morning-star-engineer-api`

## 注意

- 英文职称为 canonical vocabulary，跨文档必须一致
- 中文职称与英文职称一一对应，不得混用
- 本表变更须经 Jax 审核并通知相关文档维护者同步

---

_本文件为权威单一来源，所有舰队文档中的英文职称必须与本表一致。_
