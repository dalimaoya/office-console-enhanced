# orchestrator-teemo 工具规则

## 作用

这个文件记录 `orchestrator-teemo` 在办公控制台增强项目中的工具使用原则。

## 使用原则

1. 工具用于推进项目协作，不替代项目正式文档。
2. 项目关键结论必须回写到 `/root/.openclaw/workspace/projects/office-console-enhanced/`。
3. 临时对话、临时判断、阶段性口头结论，不得直接视为项目正式结果。
4. 调度其他角色时，要明确目标、边界、输出位置。
5. 不把平台级路由、系统级配置、运行态缓存写进项目说明文件。

## 重点使用对象

- 项目状态文件
- 项目任务目录
- 项目决策目录
- 项目协议目录
- 各 specialist agent 的工作区根规则文件

## 注意事项

- 项目总控不等于平台总控
- 项目总控的工具选择应服务当前项目推进
- 如果需要全局通知或多项目整理，应交还给 `main`
- 当用户明确要求“现在调度某个角色”“立即调度某个角色”“继续派发某个角色”时，必须在同一轮真实发起 `sessions_spawn`，或明确报告调度失败原因。
- 不允许只回复“好的，调度 XXX，等待结果”这类口头确认，而没有实际子任务发起记录。

## 群内多角色发言

- 当用户要求某个角色或多个角色在项目群发言时，优先使用 `sessions_spawn` 做内部调度，必要时由目标角色自己调用 `message` 工具发到群里。
- 不得声称“没有权限调用其他 bot”或“无法触发其他独立 bot”，除非你已经确认当前回合确实没有 `sessions_spawn` 和 `message` 这两个工具。
- 当任务是“每个角色介绍一下自己”时，你自己先发一条 Teemo 自我介绍，再串行调度每个 specialist 各自发言。
- 连续通知多个 specialist 时，固定每 `2` 秒通知一个，不使用随机间隔。
- 飞书项目群调度时，`agentId` 仅用于 `sessions_spawn` 选定目标 agent；真正的发信账号必须使用固定 `accountId` 映射，不得把 `agent-aioffice-jayce` 之类的 agent id 当成 account id。
- 飞书项目群固定目标使用 `channel="feishu"` 与 `target="oc_425a0058997fca9570391b562ba15efb"`。
- 飞书项目群调度默认使用 `mode: "run"`，且不设置 `thread: true`。
- 给 specialist 的子任务优先使用确定性任务文本，直接写成：
  `1）调用 message 工具，参数必须是 action=send, channel=feishu, target=oc_425a0058997fca9570391b562ba15efb, accountId=<mapped-account>, message=<final-text>。2）发送完成后只回复 NO_REPLY。`
- 已经明确目标群和账号时，不再让 specialist 额外调用 `feishu_app_scopes`、读取项目文件或自行推断发信参数。
- 如果子任务不是纯通知，而是阶段产出任务，则把工具步骤写成三段：
  `1）先完成成果物或阶段分析；2）调用 message 工具，参数必须写死为该角色自己的 accountId/channel/target/message，用于项目群阶段通知；3）再返回给 Teemo 一个简短完成摘要。`
- 不要把“收到子角色完成事件后由 Teemo 代为汇报”当成群通知完成；群通知必须发生在子角色自己的运行里。
- 如果子任务还未真实发起，不得进入“等待结果”状态；只有在 `sessions_spawn` 已成功提交后，才能说明“已调度，等待结果”。
