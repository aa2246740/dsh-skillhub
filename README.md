<div align="center">

# 🧩 dsh-skillhub

*为 [DeepSeek Harness (dsh)](https://github.com/deepseek-ai/deepseek-harness) 打造的本地技能与 MCP 服务统一开关管理插件*

```bash
dsh plugin --profile web add github:aa2246740/dsh-skillhub
```

已包含编译产物，安装无需 pnpm 或本地构建。

[![GitHub Release](https://img.shields.io/badge/release-v1.0.1-blue?style=flat-square)](https://github.com/aa2246740/dsh-skillhub/releases)
[![DeepSeek Harness](https://img.shields.io/badge/DeepSeek%20Harness-0.1.5--rc.3-4F46E5?style=flat-square)](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.1.5-rc.3)
[![License](https://img.shields.io/badge/license-MIT-yellow?style=flat-square)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/aa2246740/dsh-skillhub?style=flat-square)](https://github.com/aa2246740/dsh-skillhub/stargazers)

[特性亮点](#-特性) • [一键安装](#-安装) • [使用指南](#-使用说明) • [传导机制](#-开关传导规则) • [常见问题](#-常见问题)

</div>

---

## 📖 简介

**dsh-skillhub** 是专为 DeepSeek Harness 设计的本地技能与 MCP 统一开关管理面板。

它能自动扫描并列出磁盘上已有的所有 Skills（`~/.agents/skills` 与 `$DSH_HOME/skills`）以及运行中的 MCP 工具服务，提供 **全局 (Global) / 本项目 (Project) / 本对话 (Chat)** 三层独立开关控制与智能向下传导能力。

无需手动修改配置，安装后自动挂载，纯可见性控制，绝不修改或删除任何原始磁盘文件。

---

## ✨ 特性

- ⚡ **一键即用**：严格遵循 DSH 官方 Bundle 规范，一行命令自动挂载，无需繁琐接线。
- 🗂️ **本地技能即插即用**：自动读取 Agent 目录与 DSH 目录技能，原生安全，不增删改磁盘文件。
- 🎯 **三层作用范围**：全局设置机器默认值、项目管理工程级偏好、单对话按需微调，互不干扰。
- 🔄 **智能向下传导**：全局操作同步覆盖所有层，项目操作同步所属对话，对话临时覆盖，新会话自动继承。
- 🔌 **MCP 服务联动支持**：独立的 MCP 页签，按服务动态隐藏/暴露工具，进程常驻。
- 🎨 **原生细节融合**：无感切换作用范围（彻底消除骨架屏闪烁），带开关生效贴心提示（如刷新页面以载入 `/` 自动补全）。
- 🚀 **开箱即用**：`main` 分支已内置编译产物，用户端免装编译环境、免配置 `allowBuilds`。

---

## 📦 安装

### 1. 一键安装（推荐）

在终端中执行 DeepSeek Harness 官方插件安装命令：

```bash
# 如果已全局安装 dsh CLI
dsh plugin --profile web add github:aa2246740/dsh-skillhub

# 或者使用 npx
npx @deepseek-ai/dsh@0.1.5-rc.3 plugin --profile web add github:aa2246740/dsh-skillhub
```

### 2. 重启生效

安装完成后，**重启你的 DeepSeek Harness 服务**即可加载插件：

```bash
dsh web
```

> **提示**：DeepSeek Harness 在系统启动时编排插件树，因此安装新插件后重启服务即可在**系统设置**及**对话输入框**中看到技能与 MCP 面板。

---

## 📖 使用说明

### 1. 全局管理（设置页）
打开 DSH **设置** → 找到 **`skill&mcp`** 页面：
- 浏览本机所有已安装的技能与 MCP 服务。
- 支持单个开关、文件夹/分组批量开关，以及右上角「全部开启 / 全部关闭」。
- 全局调整将作为所有项目与会话的默认生效值。

### 2. 项目与会话即时调控（输入框上方）
在对话输入框上方点击 **「技能」** 胶囊按钮：
- 弹出轻量快捷面板，自由切换 **「本对话」** 与 **「本项目」**。
- 支持快捷搜索技能、一键复制 `/<skill-name>` 命令。
- 切换无闪烁，调整后模型下一次回复立即按新配置生效。

---

## ⚙️ 开关传导规则

| 操作层级 | 影响范围 | 说明 |
|---|---|---|
| **全局 (Global)** | 全局 + 所有项目 + 所有对话 | 统一设定基准，覆盖旧选项（重复设同值也同步） |
| **本项目 (Project)** | 当前项目 + 该项目下所有对话 | 仅作用于本项目，不影响其他项目及其会话 |
| **本对话 (Chat)** | 仅当前对话 | 临时调整，不影响其他会话 |
| **新建继承** | 自动向下继承 | 新建项目继承全局状态；新开会话继承所属项目状态 |

---

## 🔄 升级与卸载

### 更新至最新版本

```bash
dsh plugin --profile web add github:aa2246740/dsh-skillhub
```

### 卸载插件

```bash
dsh plugin --profile web remove dsh-skillhub
```

---

## ❓ 常见问题

<details>
<summary><b>Q: 安装后刷新页面没有出现插件功能？</b></summary>

A: DSH 插件在服务启动时编排 Context 树。请在运行 DSH 的终端按 `Ctrl + C` 停止，然后重新运行 `dsh web` 启动即可。
</details>

<details>
<summary><b>Q: 为什么开启了某个 Skill，输入框输入 <code>/</code> 没有立刻补全？</b></summary>

A: DSH 的斜杠命令目录在前端页面生命周期内缓存，开启后只需刷新一次浏览器页面（Cmd+R / F5），新的技能命令就会出现在补全列表中；而模型端下一次对话直接生效。
</details>

<details>
<summary><b>Q: 关闭某个 Skill 后，为什么当前会话模型似乎还记得？</b></summary>

A: 关闭技能会立刻阻止后续向模型提供该技能的定义，但如果此前该技能的内容已经被读取进当前对话的上下文历史中，该轮会话中已读内容不会被篡改。新开一个会话即可彻底清空。
</details>

---

## 📄 License

MIT © [aa2246740](https://github.com/aa2246740)
