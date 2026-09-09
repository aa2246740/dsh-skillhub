/** SkillHub copy. zh is the key-set source of truth. */

export const zh = {
  'nav': 'skill&mcp',
  'chip': '技能',
  'chip.aria': '技能',

  // Tabs
  'tab.skills': '技能',
  'tab.mcp': 'MCP',
  'tab.aria': '分类切换',

  // Titles & Ledes
  'title.global': '全局技能',
  'title.context': '技能设置',
  'lede.global': '管理所有项目的技能默认状态。',
  'lede.context': '点击技能名复制命令，修改开关后刷新页面生效。',

  'mcp.title': 'MCP',
  'mcp.title.global': '全局 MCP',
  'mcp.title.context': 'MCP 设置',
  'mcp.lede.global': '控制 MCP 工具显隐，关闭后不占用模型上下文。',
  'mcp.lede.context': '控制当前对话中可调用的 MCP 工具。',
  'mcp.help': '按服务控制后续对话中的工具显隐，后台进程常驻。',
  'mcp.help.session': '',
  'mcp.help.project': '',
  'mcp.help.global': '',

  // Bulk Actions
  'allOff': '全部关闭',
  'allOn': '全部开启',
  'allInherit': '恢复默认',

  // Counts
  'count.on': '{n} 开启',
  'count.off': '{n} 关闭',
  'count.collisions': '{n} 个重名',
  'count.skills': '{n} 个技能',
  'count.skillsOne': '{n} 个技能',
  'mcp.tools': '{n} 个工具',

  // Layers / Scope
  'layer.aria': '作用范围',
  'layer.session': '本对话',
  'layer.project': '本项目',
  'layer.global': '全局',
  'help.session': '',
  'help.project': '',
  'help.global': '',
  'session.needsChat': '请先打开一个对话',
  'project.needsWorkspace': '请先打开一个工作区',
  'source.global': '默认',
  'source.project': '已自定',
  'source.session': '已自定',

  // Actions
  'inherit.action': '恢复',
  'inherit.skill': '恢复 {name} 为默认设置',
  'inherit.folder': '恢复 {name} 文件夹为默认设置',
  'mcp.inherit': '恢复',
  'mcp.inherit.server': '恢复 {name} 为默认设置',

  // Copy & Refresh
  'copy.slash': '点击复制 /{name}',
  'copy.done': '已复制',
  'refresh.hint': '设置已变更，刷新后生效',
  'refresh.action': '刷新页面',

  // Empty States
  'skills.empty.title': '暂无已安装技能',
  'skills.empty.desc': '将技能放入 ~/.agents/skills 即可在此启用。',
  'skills.empty.search': '未找到匹配的技能',
  'mcp.empty': '暂无已连接的 MCP 服务。',
  'mcp.empty.title': '暂无 MCP 服务',
  'mcp.empty.desc': '在环境中配置并启动外部 MCP 后，可在此随时开关工具。',
  'mcp.empty.note': '',

  // Warnings / Badges / System
  'legacy.snapshot': '当前为快照模式，点击“恢复默认”可跟随最新设置。',
  'search': '搜索技能',
  'search.placeholder': '搜索技能...',
  'error.load': '加载失败：{error}',
  'error.retry': '重试',
  'collision.warn': '存在同名技能：',
  'loading': '正在加载...',
  'home.agent': 'Agent 目录',
  'home.dsh': 'DSH 目录',
  'empty.home': '暂无技能',
  'empty.search': '未找到匹配技能',
  'expand': '展开 {name}',
  'collapse': '收起 {name}',
  'switch.folder': '文件夹 {name}，{state}',
  'switch.skill': '技能 {name}，{state}',
  'switch.mcp': 'MCP 服务 {name}，{state}',
  'mcp.unsupported': '不支持动态隐藏',
  'mcp.unavailable': '服务暂未就绪，请稍后重试',
  'badge.link': '链接',
  'badge.collision': '重名',
  'broken.missing': '链接失效',
  'broken.missingNamed': '链接目标不存在：{target}',
  'broken.empty': '目录中未包含 SKILL.md',
  'broken.name': '技能名无效',
  'broken.unreadable': '无法读取文件',
  'broken.frontmatter': '配置格式错误',
  'gate.on': '开',
  'gate.off': '关',
  'gate.mixed': '部分',
} satisfies Record<string, string>

export type SkillHubKey = keyof typeof zh

export const en = {
  'nav': 'skill&mcp',
  'chip': 'Skills',
  'chip.aria': 'Skills',

  // Tabs
  'tab.skills': 'Skills',
  'tab.mcp': 'MCP',
  'tab.aria': 'Category switcher',

  // Titles & Ledes
  'title.global': 'Global Skills',
  'title.context': 'Skill Settings',
  'lede.global': 'Default skill state across all projects.',
  'lede.context': 'Click skill name to copy command. Reload to apply changes.',

  'mcp.title': 'MCP',
  'mcp.title.global': 'Global MCP',
  'mcp.title.context': 'MCP Settings',
  'mcp.lede.global': 'Control tool visibility. Hidden tools will not consume context.',
  'mcp.lede.context': 'Manage MCP tools active in this conversation.',
  'mcp.help': 'Control tool visibility for subsequent turns; process remains running.',
  'mcp.help.session': '',
  'mcp.help.project': '',
  'mcp.help.global': '',

  // Bulk Actions
  'allOff': 'All Off',
  'allOn': 'All On',
  'allInherit': 'Reset All',

  // Counts
  'count.on': '{n} on',
  'count.off': '{n} off',
  'count.collisions': '{n} collisions',
  'count.skills': '{n} skills',
  'count.skillsOne': '{n} skill',
  'mcp.tools': '{n} tools',

  // Layers / Scope
  'layer.aria': 'Scope',
  'layer.session': 'This Chat',
  'layer.project': 'This Project',
  'layer.global': 'Global',
  'help.session': '',
  'help.project': '',
  'help.global': '',
  'session.needsChat': 'Open a chat first',
  'project.needsWorkspace': 'Open a workspace first',
  'source.global': 'Default',
  'source.project': 'Customized',
  'source.session': 'Customized',

  // Actions
  'inherit.action': 'Reset',
  'inherit.skill': 'Reset {name} to default',
  'inherit.folder': 'Reset {name} folder to default',
  'mcp.inherit': 'Reset',
  'mcp.inherit.server': 'Reset {name} to default',

  // Copy & Refresh
  'copy.slash': 'Click to copy /{name}',
  'copy.done': 'Copied',
  'refresh.hint': 'Settings updated. Reload to apply',
  'refresh.action': 'Reload',

  // Empty States
  'skills.empty.title': 'No Skills Installed',
  'skills.empty.desc': 'Place skill directories in ~/.agents/skills to manage them here.',
  'skills.empty.search': 'No matching skills found',
  'mcp.empty': 'No MCP services currently connected.',
  'mcp.empty.title': 'No MCP Services',
  'mcp.empty.desc': 'Connect MCP servers in your environment to manage tools here.',
  'mcp.empty.note': '',

  // Warnings / Badges / System
  'legacy.snapshot': 'Snapshot mode. Click Reset All to track latest settings.',
  'search': 'Search skills',
  'search.placeholder': 'Search skills...',
  'error.load': 'Load failed: {error}',
  'error.retry': 'Retry',
  'collision.warn': 'Conflicting skill names:',
  'loading': 'Loading...',
  'home.agent': 'Agent Directory',
  'home.dsh': 'DSH Directory',
  'empty.home': 'No skills',
  'empty.search': 'No matching skills',
  'expand': 'Expand {name}',
  'collapse': 'Collapse {name}',
  'switch.folder': 'Folder {name}, {state}',
  'switch.skill': 'Skill {name}, {state}',
  'switch.mcp': 'MCP service {name}, {state}',
  'mcp.unsupported': 'Dynamic hide unsupported',
  'mcp.unavailable': 'Service unavailable, please retry',
  'badge.link': 'link',
  'badge.collision': 'conflict',
  'broken.missing': 'Broken link',
  'broken.missingNamed': 'Missing target: {target}',
  'broken.empty': 'Missing SKILL.md',
  'broken.name': 'Invalid name',
  'broken.unreadable': 'Unreadable file',
  'broken.frontmatter': 'Invalid config',
  'gate.on': 'on',
  'gate.off': 'off',
  'gate.mixed': 'mixed',
} satisfies Record<SkillHubKey, string>
