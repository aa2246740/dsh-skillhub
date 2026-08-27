# Installing a Pack adds a symlink in a home

SkillHub does not copy skill files into Agent home or DSH home. It links the Pack directory so the author’s folders stay the Groups you toggle, and `git pull` in the original clone is enough to update. Default link target is Agent home. If the user marks it DSH-only, the link goes in DSH home.
