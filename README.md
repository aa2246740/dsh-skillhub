# dsh-skillhub

列出已经在磁盘上的 Skills：Agent home `~/.agents/skills` 和 DSH home `$DSH_HOME/skills`。设置页管 Global Defaults，composer 面板管 Project 和 Chat 覆盖。

它不安装、不复制、不删除 skill 文件。关掉只是不进目录，文件夹还在。SkillHub 只管理磁盘技能。插件自己注册的技能（含 Resume 斜杠命令）仍由插件控制：SkillHub 不列出、不遮蔽、也不改它们的调用权限。

词表见 [`CONTEXT.md`](CONTEXT.md)。决策见 [`docs/adr/`](docs/adr/)。

## 本机数据

| 内容 | 位置 |
|---|---|
| Installed Skills | `~/.agents/skills`, `$DSH_HOME/skills` |
| 可见性文档 | `$DSH_HOME/skillhub/`（`global.json`, `projects/<hash>.json`, `sessions/<id>.json`；MCP 另存 `mcp-*.json`） |

项目可见性按本机文件夹哈希。不会写进 git 仓库。生效顺序是 Chat → Project → Global。Project 和 Chat 只存覆盖，父层改了，还在跟随的子孙立刻跟上。

可见性文档是 version 2：一层默认值，再加每条 Skill 的覆盖。关掉一项不会改未点名或以后新加技能的默认值。Global「全部关闭」也会罩住以后新加的磁盘 Skill，但不覆盖插件命令。旧 Session 快照保持显式，直到用户选 **恢复默认**。

不要提交 `$DSH_HOME/skillhub/`、`.env`、`.dshx/`，也不要提交编好的 `lib/`。client bundle 会嵌进本机绝对路径。

## MCP 可见性

面板分成「技能」和「MCP」两个独立页。按服务控制后续请求里模型能看到的 MCP 工具，进程继续跑，已有对话上下文不会撤回。当前 DSH MCP 客户端只暴露工具，没有资源/提示词目录。命名冲突或作用域本地注册的服务会标成不支持隐藏，不会假装已经藏干净。用服务开关或「恢复」即可还原。

## 安装

克隆进 Harness 的 `my-plugins/`，或加一条指向这份检出的 `file:` 依赖。

```sh
pnpm --dir my-plugins/dsh-skillhub install --ignore-workspace
pnpm --dir my-plugins/dsh-skillhub test
pnpm --dir my-plugins/dsh-skillhub build
dshx check dsh-skillhub
dshx activation-plan dsh-skillhub --change new-client
dshx activate-new-client dsh-skillhub --profile web --port <live-web-port>
```

出现 `CLIENT_MANIFEST_PRESENT` 之后刷新 WebUI。不要再把这个 id 写进 `dsh.profile.bundles`。

Host HTTP 是 `/skillhub/catalog`。官方 `/plugins` 前缀只服务 client bundle，不要让它接管这个 API。

在 Web 上关掉 preset 里的 `skill-filesystem` 行，项目 skill 文件夹才会保持惰性。`dsh-web-app` 里的 host `skill-filesystem` 行已经关掉。

构建时把 `DSHX_HARNESS` 指到本机 runtime checkout。现有 client 走 HMR；服务端改动走 DSHX 固定热加载，不需要重启 Host。

## 许可

MIT。见 [LICENSE](LICENSE)。
