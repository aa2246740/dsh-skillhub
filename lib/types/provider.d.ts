import type { SkillProvider } from '@deepseek-ai/dsh-skill';
import type { Catalog, ManagedSkill } from './catalog.ts';
import type { SkillHub } from './hub.ts';
/**
 * Resolve the chat whose visibility layer applies to a lookup.
 *
 * The registry passes its viewing scope through as an opaque {@link ScopeKey}.
 * For an agent read that is the agent's own Context — the session id lives on
 * the scope tag the registry wrote into it, NOT as a `scope.session` property.
 * Reading only the property shape silently resolved no session, so a Chat-layer
 * override never reached the provider and the model kept seeing the Project or
 * Global value the user had just overridden in the conversation panel.
 *
 * The plain-object shape is still accepted for direct callers that hand over an
 * `{ session: { id } }` value, and for the per-agent registration below, which
 * knows its own session id and can pass it in as a string.
 * @param scope - the lookup scope: an agent Context, a scope key, or an id.
 * @returns the session id, or undefined when the read is not chat-scoped.
 */
export declare function sessionIdFromScope(scope: unknown): string | undefined;
export declare function providerSkillsFromCatalog(catalog: Catalog): ManagedSkill[];
/**
 * Build the provider the registry reads.
 *
 * `boundSessionId` exists because one provider instance serves every scope in
 * the layer it was registered in: the global registration cannot tell which
 * chat is asking, while the per-agent registration made on `agent/created`
 * knows exactly one agent. Passing that chat in here makes the Chat layer apply
 * even when a caller forwards no usable scope, which is what previously let a
 * chat-level override be ignored by the model's catalog.
 * @param hub - visibility store backing the provider.
 * @param boundSessionId - chat this provider belongs to, when it is agent-scoped.
 */
export declare function createSkillHubProvider(hub: SkillHub, boundSessionId?: string): SkillProvider;
//# sourceMappingURL=provider.d.ts.map