# dsh-skillhub

SkillHub is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web plugin that lists Skills already on disk in Agent home (`~/.agents/skills`) and DSH home (`~/.dsh/skills`). Settings owns Global Defaults; the composer panel owns Project and Chat overrides.

It does not delete skill files. Off leaves the folder in place. SkillHub only manages disk Skills in Agent home and DSH home. Plugin registrations, including Resume slash commands, remain owned by their plugin: SkillHub does not list, shadow, or change their invocation permissions.

Vocabulary: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/).

## Privacy

This repository is source only. It does not contain your skill list, session ids, workspace paths, or visibility state.

Local data stays on the machine:

| What | Where |
|---|---|
| Installed Skills | `~/.agents/skills`, `$DSH_HOME/skills` |
| Visibility documents | `$DSH_HOME/skillhub/` (`global.json`, `projects/<hash>.json`, `sessions/<id>.json`) |

Project visibility is keyed by folder hash on this user/machine. It is not written into a git repo. Effective visibility resolves Chat → Project → Global. Project and Chat documents store overrides only, so parent changes immediately reach descendants that still follow them.

Visibility documents use version 2 with a layer default plus per-Skill overrides. Turning one Skill off does not change the default for untouched or future Skills. Global “All off” also covers disk Skills added later, but never plugin commands. Legacy Session snapshots remain explicit until the user chooses **Follow parent for all**. Existing saved defaults and explicit overrides are preserved; obsolete Host entries are ignored.

Do not commit `$DSH_HOME/skillhub/`, `.env`, `.dshx/`, or built `lib/` (client bundles embed absolute machine paths).

## Install

Clone into the Harness `my-plugins/` directory, or add a `file:` dependency that points at this checkout.

```sh
pnpm --dir my-plugins/dsh-skillhub install --ignore-workspace
pnpm --dir my-plugins/dsh-skillhub test
pnpm --dir my-plugins/dsh-skillhub build
dshx check dsh-skillhub
dshx activation-plan dsh-skillhub --change new-client
dshx activate-new-client dsh-skillhub --profile web --port <live-web-port>
```

Reload the WebUI after `CLIENT_MANIFEST_PRESENT`. Do not also add this id to `dsh.profile.bundles`.

Host HTTP is `/skillhub/catalog`. The official `/plugins` prefix serves client bundles and must not own this API.

On Web, disable the **preset** `skill-filesystem` row so project skill folders stay inert. The host `skill-filesystem` row is already disabled in `dsh-web-app`.

## MCP visibility

SkillHub & MCP lists registered MCP services and controls their tool visibility with Global → Project → Session overrides. Changes affect subsequent tool assembly and execution; they do not stop MCP processes or erase existing conversation history. The installed DSH MCP client exposes tools, not a resource/prompt catalog. A service whose namespace is ambiguous or whose tools are scope-local is marked unsupported rather than falsely reported hidden. Recover visibility with the service switch or Inherit.

Build this checkout in its existing plugins directory with the sibling runtime checkout. Set `DSHX_HARNESS` to that runtime, then run `npm run build` and `npm test`. Tests include an isolated real stdio MCP fixture and shut it down afterwards. Existing-client HMR updates the panel; server changes require the bounded DSHX hot-reload path. No Host restart is required.
