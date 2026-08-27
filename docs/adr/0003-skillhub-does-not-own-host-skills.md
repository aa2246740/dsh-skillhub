# SkillHub does not own host skills

Plugins may register skills at runtime without installing a folder into Agent home or DSH home. SkillHub must not list, Off, or Delete those. If it filtered them, a plugin could look installed and still be dead. SkillHub only manages Skills in the two homes.
