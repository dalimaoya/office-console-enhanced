# OpenClaw Office Console（Windows 版）环境检测项与错误归类表
> 基于 MVP 架构稿继续细化的环境检测与诊断设计文档

---

## 1. 文档目的

本文档用于定义 **OpenClaw Office Console（Windows 版）** 第一版中的：

- 环境检测范围
- 检测项字段
- 状态判定规则
- 错误归类标准
- 修复建议输出方式

本文档目标是为以下工作提供统一依据：

- 首启环境检查流程
- 首页状态摘要生成
- 日志与诊断页展示
- Console Agent 问题发现逻辑
- 前后端接口设计
- 开发任务拆分

---

## 2. 设计目标

第一版环境检测与错误归类不追求“工程师级全链路监控”，而应优先满足以下目标：

1. 普通办公用户能看懂
2. 关键问题能被尽早发现
3. 每个问题都能指向下一步动作
4. 错误归类能支撑 Console Agent 输出建议
5. 错误与状态字段尽量标准化

---

## 3. 检测范围总览

第一版 Windows 检测范围建议聚焦以下 6 类：

```text
1. 系统环境
2. OpenClaw 环境
3. 工作目录与文件权限
4. 本地端口与进程状态
5. 模型连接能力
6. 飞书与浏览器等外围能力
```

---

## 4. 检测状态标准

所有检测项建议统一使用以下状态：

- `pass`：通过
- `warn`：警告
- `fail`：失败
- `unknown`：未知 / 未检测

### 4.1 状态定义

#### pass
检测项满足当前运行要求。

#### warn
检测项不影响基础运行，但会影响部分能力或存在潜在风险。

#### fail
检测项会导致基础能力不可用，必须先处理。

#### unknown
当前未执行检测，或当前上下文不足以得出结论。

---

## 5. 检测项统一字段结构

每个检测项建议统一包含以下字段：

- `check_id`：检测项唯一标识
- `category`：所属分类
- `name`：检测项名称
- `status`：检测状态
- `summary`：结果摘要
- `detail`：详细说明
- `impact_level`：影响等级（P0 / P1 / P2）
- `suggested_action`：推荐动作
- `action_type`：动作类型
- `last_checked_at`：最近检测时间

### 5.1 动作类型建议

- `goto_config`
- `retry_check`
- `open_diagnostics`
- `open_logs`
- `copy_command`
- `select_directory`
- `open_original_console`

---

## 6. 系统环境检测项

## 6.1 操作系统版本

### check_id
`system.os_version`

### 目标
确认当前 Windows 版本满足最低运行要求。

### 字段补充
- `os_name`
- `os_version`
- `architecture`

### 状态判定
- pass：版本满足要求
- warn：版本偏旧但理论可运行
- fail：低于最低要求

### 推荐动作
- 更新系统
- 查看系统要求说明

---

## 6.2 当前用户权限

### check_id
`system.user_permission`

### 目标
确认当前用户是否具备基本读写和运行权限。

### 字段补充
- `is_admin`（可选，仅展示）
- `can_write_workspace`
- `can_launch_local_process`

### 状态判定
- pass：具备基本权限
- warn：部分目录写入可能受限
- fail：关键目录或进程启动受限

### 推荐动作
- 更换工作目录
- 以更高权限重新启动应用

---

## 6.3 本地网络连通性

### check_id
`system.network_basic`

### 目标
确认当前机器具备基础联网能力。

### 字段补充
- `is_online`
- `dns_available`（可选）
- `http_test_result`

### 状态判定
- pass：基础网络可用
- warn：网络波动或局部不可达
- fail：无基础联网能力

### 推荐动作
- 检查网络连接
- 稍后重新检测

---

## 7. OpenClaw 环境检测项

## 7.1 本机是否存在 OpenClaw 实例

### check_id
`openclaw.instance_detected`

### 目标
确认本机是否已有可关联的 OpenClaw 运行环境。

### 字段补充
- `detected`
- `instance_path`
- `instance_type`（已有本地实例 / 未找到）

### 状态判定
- pass：检测到可关联实例
- warn：检测到疑似实例但不完整
- unknown：尚未检测
- fail：用户选择“关联已有实例”但未找到有效实例

### 推荐动作
- 重新扫描
- 手动选择目录
- 改为新安装

---

## 7.2 OpenClaw 后端可达性

### check_id
`openclaw.backend_reachable`

### 目标
确认当前控制台能否连接到 OpenClaw 后端。

### 字段补充
- `backend_url`
- `reachable`
- `response_time_ms`
- `backend_version`（如可读）

### 状态判定
- pass：后端可达
- warn：可达但响应异常慢
- fail：不可达

### 推荐动作
- 检查后端是否启动
- 检查端口配置
- 打开原始后台 / 日志

---

## 7.3 OpenClaw 工作区可用性

### check_id
`openclaw.workspace_valid`

### 目标
确认当前工作目录具备 OpenClaw 所需基础结构。

### 字段补充
- `workspace_path`
- `exists`
- `readable`
- `writable`
- `required_files_ok`

### 状态判定
- pass：可正常使用
- warn：目录存在但结构不完整
- fail：目录不存在或不可写

### 推荐动作
- 重新选择工作目录
- 初始化新工作区
- 修复目录权限

---

## 8. 工作目录与文件权限检测项

## 8.1 默认输出目录可写性

### check_id
`storage.output_dir_writable`

### 目标
确认生成结果可写入默认输出目录。

### 字段补充
- `output_dir`
- `exists`
- `writable`

### 状态判定
- pass：可写
- warn：路径存在但可能受限
- fail：不可写

### 推荐动作
- 更换输出目录
- 检查权限

---

## 8.2 日志目录可写性

### check_id
`storage.logs_dir_writable`

### 目标
保证日志与诊断信息可落盘。

### 状态判定
- pass：可写
- warn：存在写入延迟或局部受限
- fail：不可写

### 推荐动作
- 更换日志目录
- 检查磁盘权限

---

## 8.3 磁盘空间检查（可选但建议）

### check_id
`storage.disk_space`

### 目标
确认剩余空间足以支撑基础运行。

### 字段补充
- `free_space_mb`
- `threshold_mb`

### 状态判定
- pass：空间充足
- warn：空间接近阈值
- fail：明显不足

### 推荐动作
- 清理磁盘空间
- 更换目录

---

## 9. 本地端口与进程检测项

## 9.1 控制台端口占用

### check_id
`runtime.console_port`

### 目标
确认控制台使用的本地端口未冲突。

### 字段补充
- `port`
- `occupied`
- `occupied_by`

### 状态判定
- pass：端口可用
- warn：端口被占用但可切换
- fail：端口冲突且无法启动

### 推荐动作
- 切换端口
- 关闭冲突进程
- 重新检测

---

## 9.2 OpenClaw 后端端口占用

### check_id
`runtime.backend_port`

### 目标
确认 OpenClaw 后端端口是否可用。

### 状态判定
同上。

---

## 9.3 本地进程状态

### check_id
`runtime.core_process`

### 目标
确认关键本地服务进程是否已启动。

### 字段补充
- `process_name`
- `is_running`
- `pid`
- `uptime`

### 状态判定
- pass：关键进程正常
- warn：进程重启频繁或状态不稳定
- fail：关键进程未运行

### 推荐动作
- 重启服务
- 查看日志
- 重新检测

---

## 10. 模型连接能力检测项

## 10.1 模型配置是否存在

### check_id
`model.config_present`

### 目标
确认至少存在一个有效模型配置。

### 字段补充
- `provider`
- `model_name`
- `config_present`

### 状态判定
- pass：存在配置
- fail：不存在配置

### 推荐动作
- 前往模型配置页

---

## 10.2 模型连接测试

### check_id
`model.connectivity`

### 目标
确认当前模型接口可连接并可返回有效结果。

### 字段补充
- `provider`
- `model_name`
- `test_result`
- `latency_ms`
- `last_tested_at`

### 状态判定
- pass：测试通过
- warn：通过但延迟较高或结果异常
- fail：测试失败

### 推荐动作
- 检查 API Key
- 检查 Base URL
- 更换模型
- 重试测试

---

## 11. 飞书与浏览器能力检测项

## 11.1 飞书授权状态

### check_id
`feishu.auth`

### 目标
确认飞书配置是否完整且授权有效。

### 字段补充
- `configured`
- `auth_valid`
- `last_tested_at`

### 状态判定
- pass：授权有效
- warn：配置存在但未测试
- fail：授权无效或缺失

### 推荐动作
- 前往飞书配置页
- 重新授权
- 测试授权

---

## 11.2 飞书写入测试

### check_id
`feishu.write_test`

### 目标
确认当前系统可在目标位置成功写入测试文档。

### 字段补充
- `target_space`
- `write_result`
- `last_tested_at`

### 状态判定
- pass：写入成功
- warn：已配置但未测试写入
- fail：写入失败

### 推荐动作
- 重新测试写入
- 检查权限范围
- 重新配置目标位置

---

## 11.3 浏览器连接能力

### check_id
`browser.connection`

### 目标
确认浏览器相关能力是否处于可用状态。

### 字段补充
- `detected`
- `connectable`
- `last_checked_at`

### 状态判定
- pass：浏览器能力正常
- warn：浏览器可用性不稳定
- fail：无法连接或未检测到浏览器能力

### 推荐动作
- 重新检测浏览器
- 重启浏览器
- 查看浏览器修复建议

---

## 12. 错误归类体系

第一版建议采用 **“分类 + 等级 + 建议动作”** 的轻量诊断模型。

### 12.1 一级分类建议

```text
1. SYSTEM_ERROR
2. OPENCLAW_ERROR
3. STORAGE_ERROR
4. RUNTIME_ERROR
5. MODEL_ERROR
6. FEISHU_ERROR
7. BROWSER_ERROR
8. TASK_ERROR
```

---

## 13. 各类错误定义

## 13.1 SYSTEM_ERROR
系统环境类问题。

典型场景：
- 操作系统版本不满足要求
- 本地网络完全不可用
- 当前用户权限不足

建议展示字段：
- 错误标题
- 影响范围
- 推荐动作

---

## 13.2 OPENCLAW_ERROR
OpenClaw 实例、后端、工作区相关问题。

典型场景：
- 未检测到有效实例
- 后端不可达
- 工作区结构异常

---

## 13.3 STORAGE_ERROR
路径、读写、磁盘空间相关问题。

典型场景：
- 工作目录不可写
- 输出目录不可用
- 日志目录写入失败
- 磁盘空间不足

---

## 13.4 RUNTIME_ERROR
运行时端口、进程、服务冲突问题。

典型场景：
- 端口被占用
- 核心进程未启动
- 本地服务异常退出

---

## 13.5 MODEL_ERROR
模型配置与连接问题。

典型场景：
- API Key 缺失
- Base URL 错误
- 模型名称错误
- 连接测试失败

---

## 13.6 FEISHU_ERROR
飞书配置、授权、写入问题。

典型场景：
- 授权失效
- Token 无效
- 权限不足
- 写入测试失败

---

## 13.7 BROWSER_ERROR
浏览器能力异常问题。

典型场景：
- 浏览器未连接
- 浏览器状态不稳定
- 检测失败
- 自动操作失败

---

## 13.8 TASK_ERROR
任务执行层的问题。

典型场景：
- 任务中断
- 步骤失败
- 需要人工处理
- 输出生成失败

---

## 14. 错误等级定义

建议配套错误等级：

- `critical`：阻断级
- `high`：重要告警
- `medium`：一般错误
- `low`：弱提示

### 14.1 critical
会直接阻止核心能力运行。

例如：
- 模型未配置
- OpenClaw 后端不可达
- 工作目录不可写

### 14.2 high
不阻断整体系统，但关键能力不可用。

例如：
- 飞书授权失败
- 浏览器连接失败
- 关键 Agent 异常

### 14.3 medium
影响体验，但仍可继续使用。

例如：
- 模型延迟高
- 写入测试未执行
- 推荐 Skill 未安装

### 14.4 low
仅作提醒。

例如：
- 新增功能可体验
- 某配置项尚未优化

---

## 15. 错误展示统一字段

建议所有错误对象统一包含：

- `error_id`
- `error_type`
- `error_level`
- `title`
- `summary`
- `detail`
- `affected_module`
- `recommended_action`
- `action_type`
- `created_at`

---

## 16. 典型错误样例

## 16.1 模型未配置

```json
{
  "error_id": "ERR_MODEL_CONFIG_MISSING",
  "error_type": "MODEL_ERROR",
  "error_level": "critical",
  "title": "模型未配置",
  "summary": "当前系统尚未配置任何可用模型。",
  "detail": "文档初稿、飞书知识整理、会议纪要等依赖模型的能力均不可用。",
  "affected_module": "model",
  "recommended_action": "前往模型配置页，填写至少一个可用模型并测试连接。",
  "action_type": "goto_config"
}
```

## 16.2 飞书写入失败

```json
{
  "error_id": "ERR_FEISHU_WRITE_FAILED",
  "error_type": "FEISHU_ERROR",
  "error_level": "high",
  "title": "飞书写入测试失败",
  "summary": "已配置飞书，但测试写入未成功。",
  "detail": "可能是授权范围不足、目标空间不可写或配置参数错误。",
  "affected_module": "feishu",
  "recommended_action": "重新测试授权与写入，必要时重新选择目标空间。",
  "action_type": "goto_config"
}
```

## 16.3 浏览器连接失败

```json
{
  "error_id": "ERR_BROWSER_NOT_CONNECTED",
  "error_type": "BROWSER_ERROR",
  "error_level": "high",
  "title": "浏览器能力不可用",
  "summary": "浏览器助手当前无法连接浏览器。",
  "detail": "网页自动操作类任务暂不可用。",
  "affected_module": "browser",
  "recommended_action": "进入浏览器诊断页重新检测，必要时重启浏览器。",
  "action_type": "retry_check"
}
```

---

## 17. Console Agent 与检测/错误体系的关系

### 17.1 Console Agent 的问题发现来源
Console Agent 不应直接推理原始错误日志，而应优先读取：

- 检测项状态
- 错误对象列表
- 最近失败任务摘要

### 17.2 Console Agent 的优先级逻辑
优先输出顺序建议：

1. `critical`
2. `high`
3. `medium`
4. 更新通知

这样可保证首页不被次要问题淹没。

---

## 18. 页面使用建议

### 18.1 首启环境检测页
显示：检测项列表 + 状态 + 推荐动作

### 18.2 首页状态摘要
只显示关键结果：
- 模型
- 飞书
- 浏览器
- Workspace
- Agent 健康
- 任务摘要

### 18.3 日志与诊断页
展示完整错误对象和修复建议。

### 18.4 任务详情页
展示任务执行过程中的任务级错误，而不是全部系统错误。

---

## 19. P0 实施优先级建议

第一版建议优先落地以下检测项：

### 必做检测项
- system.os_version
- openclaw.instance_detected
- openclaw.backend_reachable
- openclaw.workspace_valid
- storage.output_dir_writable
- runtime.console_port
- model.config_present
- model.connectivity
- feishu.auth
- browser.connection

### 必做错误类型
- MODEL_ERROR
- FEISHU_ERROR
- BROWSER_ERROR
- OPENCLAW_ERROR
- TASK_ERROR

---

## 20. 总结

第一版环境检测与错误归类体系不应追求复杂，而应追求：

- 用户能理解
- 系统能统一引用
- Console Agent 能消费
- 页面能一致展示
- 后续可持续扩展

因此最关键的是把检测项、错误对象和推荐动作标准化，而不是一开始就做过重的监控系统。
