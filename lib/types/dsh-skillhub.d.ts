import type { Context, Volatile } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
import { SkillHub } from './hub.ts';
export declare const name = "dsh-skillhub";
export declare const inject: string[];
export interface Config {
    /** Profile field. A settings edit is stored immediately and read on the next Host load. */
    enabled: Volatile<boolean>;
}
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
}>>, Schemastery.ObjectT<NoInfer<{
    enabled: z<boolean, boolean, "volatile-defined">;
}>>, "plain">;
export declare function apply(ctx: Context, config: Config): void;
export declare function attachAgentProvider(owner: Context, hub: SkillHub, payload: unknown): void;
//# sourceMappingURL=dsh-skillhub.d.ts.map