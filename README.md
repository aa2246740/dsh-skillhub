# dsh-skillhub

SkillHub is a [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web plugin that lists Skills already on disk in Agent home (`~/.agents/skills`) and DSH home (`~/.dsh/skills`), and lets you turn them on or off for Global, Project, or Session visibility.

It does not install, copy, or delete skill files. Off leaves the folder in place. Host/plugin skills are out of scope.

Vocabulary: [`CONTEXT.md`](CONTEXT.md). Decisions: [`docs/adr/`](docs/adr/).

## Privacy

This repository is source only. It does not contain your skill list, session ids, workspace paths, or visibility state.

Local data stays on the machine:

| What | Where |
|---|---|
| Installed Skills | `~/.agents/skills`, `$DSH_HOME/skills` |
| Visibility documents | `$DSH_HOME/skillhub/` (`global.json`, `projects/<hash>.json`, `sessions/<id>.json`) |

Project visibility is keyed by folder hash on this user/machine. It is not written into a git repo. Session copies resolve at create and then stay independent.

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
