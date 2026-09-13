import type { SkillProvider } from '@deepseek-ai/dsh-skill';
import type { Catalog, ManagedSkill } from './catalog.ts';
import type { SkillHub } from './hub.ts';
export declare function sessionIdFromScope(scope: unknown): string | undefined;
export declare function providerSkillsFromCatalog(catalog: Catalog): ManagedSkill[];
export declare function createSkillHubProvider(hub: SkillHub): SkillProvider;
//# sourceMappingURL=provider.d.ts.map