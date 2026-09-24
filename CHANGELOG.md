# Changelog

## 1.0.3

### 兼容

- 开发依赖钉在官方 `@deepseek-ai/dsh-*@0.1.7-rc.2`（tag `dsh-v0.1.7-rc.2`，SHA `477b4f420553e8a52c2fbccc464d7561b239c443`）。peer 范围仍是 `>=0.1.7-rc.1 <0.1.8`：接受 `0.1.7-rc.2`，拒绝 `0.1.7` alpha。
- 客户端内联白名单与该 tag 的 `packages/client/tsdown.client.ts` `INLINE_SAFE` 对齐，补上 `@deepseek-ai/dsh-api-workspace-controller/default-workspace`。平台模块表没有变化。
- Skill 注册、设置页 `settings.section`、composer `conversation.input.left` 的 `sessionId` / `useSessions`，以及现用图标名在 rc.2 上保持可用。rc.2 的 Button 改为 forwardRef、Menu/Tooltip 增加可选 shortcut，现有调用不需要改参数。

## 1.0.2

### 兼容

- 官方 DeepSeek Harness 依赖范围改为 `>=0.1.7-rc.1 <0.1.8`（tag `dsh-v0.1.7-rc.1`）。npm 默认 semver 不会让 `^0.1.5-rc.3` 接受 `0.1.7-rc.1`。同一范围拒绝 `0.1.7-alpha`。
- 设置页不再调用已删除的 `settings.installSection`。`enabled` 是 profile 里的 volatile 字段，设置里改完立刻落盘，下次 Host 加载时生效。
- 客户端图标改用 rc.1 的字重命名（`IconSkillOutlineRegular` 等），尺寸仍由 `size` 指定。
- `settings.section` 与 composer 的 `sessionId` / `useSessions` 改由 `@deepseek-ai/dsh-client-ui-settings` 和 `@deepseek-ai/dsh-client-ui-session` 声明，并加入 `dsh.client.inject`。
- 开发依赖里的 Cordis 钉在 `4.0.4`，Schemastery 钉在 `3.18.4`，与 rc.1 宿主一致。

## 1.0.1

### 兼容

- 官方 DeepSeek Harness 依赖范围改为 `^0.1.5-rc.2`。npm 会接受 `0.1.5-rc.3`，不会接受 `^0.1.2-rc.1` 下的 `0.1.5-rc.3`。
- 开发依赖钉在 `@deepseek-ai/dsh-*@0.1.5-rc.3`（tag `dsh-v0.1.5-rc.3`）。不面向 `0.1.7-alpha`。

## 1.0.0

首个正式版。

### 功能

- 列出磁盘上已有的 Skills：`~/.agents/skills`（Agent 目录）与 `$DSH_HOME/skills`（DSH 目录）。
- 三层作用范围开关：全局 / 本项目 / 本对话；设置页管全局，composer 面板管项目与对话。
- 开关传导语义：
  - 全局操作同步该技能到所有项目和对话，覆盖旧值（重复设同值也同步）。
  - 项目操作只同步本项目内的对话，不影响其他项目。
  - 对话操作只改自己；之后相关的上层操作会再次传导。
  - 新建项目、对话继承上层当前状态。
- 不安装、不复制、不删除 skill 文件；关闭只是不进目录，文件保留。
- 插件自己注册的技能（含 Resume 斜杠命令）不受 SkillHub 管理。
- MCP 页签：按服务控制模型可见的 MCP 工具，与技能共用同一套传导规则。
- 界面只显示当前开关：无覆盖徽标、无恢复继承控件。
- 切换作用范围时保持列表渲染，无骨架屏闪烁。
- 开关提示 toast：开启时提示 `/` 自动补全需刷新页面；关闭时说明本会话已载入内容不受影响，新开对话彻底生效。
- 中英文文案；页面与弹层两种界面。

### 存储

- `$DSH_HOME/skillhub/`：`global.json`、`projects/<hash>.json`、`sessions/<id>.json`，MCP 另存 `mcp-*.json`；`propagation-clock.json` 分配持久递增操作顺序。
- 可见性文档兼容 version 2，增加可选 `defaultRevision`、`gateRevisions`；旧配置保持原值，下一次上层操作自然传导。

### 许可

MIT
