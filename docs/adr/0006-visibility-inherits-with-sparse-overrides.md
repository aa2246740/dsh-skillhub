# Visibility inherits with sparse overrides

Global Defaults are edited only in Settings. The composer panel edits Project and Chat overrides. Effective Visibility resolves Chat → Project → Global; a missing override follows its parent immediately.

Version 2 documents store a layer default and per-Skill values. Global All on/off changes its default, so Skills added later receive the same state. Project and Chat defaults begin as `inherit`; their per-Skill value may be `on`, `off`, or `inherit`.

Legacy Session snapshots load as explicit Chat overrides and carry a migration marker. They preserve existing choices until the user selects Follow parent for all. New Chats do not create a visibility document merely by opening or listing Skills.

The HTTP API rejects Project writes without a folder and Chat writes without a session id. Invalid or unsupported documents fail closed instead of silently becoming an all-on document.
