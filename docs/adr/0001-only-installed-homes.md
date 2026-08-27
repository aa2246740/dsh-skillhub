# User skills exist only when installed into Agent home or DSH home

DSH today also scans a repo’s `.dsh/skills` and `.agents/skills`, plus custom and bundled roots. SkillHub does not. Opening a git workspace does not make its folders into Skills. A Skill is something the user installed into `~/.agents/skills` or `~/.dsh/skills`. That keeps SkillHub the only manager and matches the rule “not installed, not a skill.”
