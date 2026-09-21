import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { SkillHub } from './hub.ts';
export declare const name = "dsh-skillhub";
export declare const inject: string[];
export interface Config {
    enabled?: boolean;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config: Config): void;
export declare function attachAgentProvider(owner: Context, hub: SkillHub, payload: unknown): void;
//# sourceMappingURL=dsh-skillhub.d.ts.map