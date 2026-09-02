# Sparse Off seals unknown skills, including host plugins

Supersedes the "do not Off host skills" sentence in [ADR 0003](0003-skillhub-does-not-own-host-skills.md). SkillHub still does not Delete host plugin skills. It does occupy their catalog names.

Global All on (default `on`, empty gates) still means skills added later start on.

Once a Global document contains any `off` gate, an id with no gate is Off. Codex dropping a symlink into Agent home, or a host plugin registering `unslop`, cannot enter `<available_skills>` until the user turns that name on.

The first Global Off also rewrites default to `off` and pins every skill that was on, so the store becomes an allowlist. Existing denylist documents (default `on` plus sparse offs) are read with the same unlisted-is-off rule without waiting for a rewrite.

Host plugin skills appear under a Host home in the tree. Off lists them as not model-invocable at rank 340 so another provider cannot refill the name. Delete and Install stay refused for that home.
