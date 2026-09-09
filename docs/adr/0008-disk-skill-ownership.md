# SkillHub owns disk Skills, not plugin registrations

Supersedes ADR 0007. SkillHub manages only Skills discovered in Agent home and DSH home. A plugin may use the Harness skill registry to expose a slash command, but this does not transfer ownership to SkillHub. Do not snapshot plugin registrations, republish their names, or change their invocation flags. Old `host:` visibility entries are inert and need no destructive migration.

A per-Skill toggle only changes its selected entries. Missing entries follow the saved layer default; an unrelated Off entry cannot reinterpret an On default as Off. All on/off remains the explicit way to change the default for future disk Skills. Preserve existing stored defaults and individual choices.

Regression evidence includes a catalog test with legacy plugin notes, sparse default tests, and an isolated Web Host with the actual Resume plugin while all disk Skills are Off. Slash commands must remain visible and retain their original plugin content and user-only invocation permissions.
