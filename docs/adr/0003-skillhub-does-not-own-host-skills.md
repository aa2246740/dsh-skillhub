# SkillHub does not own host skills

Plugins may register skills at runtime without installing a folder into Agent home or DSH home. SkillHub still does not Delete those folders, because there is nothing in a home to delete.

[ADR 0007](0007-sparse-off-seals-unknown-skills.md) supersedes the old rule that SkillHub must not list or Off them. Off now occupies the catalog name so a host plugin cannot inject a skill the user never turned on.
