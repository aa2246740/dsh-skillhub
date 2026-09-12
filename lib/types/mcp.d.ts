export type McpLayer = 'global' | 'project' | 'session';
export type McpGate = 'on' | 'off';
export type McpLayerGate = McpGate | 'inherit';
export interface McpVisibilityDocument {
    readonly version: 2;
    readonly default: McpLayerGate;
    readonly gates: Readonly<Record<string, McpLayerGate>>;
}
export interface McpServerView {
    readonly name: string;
    readonly tools: number;
    readonly gate: McpGate;
    readonly source: McpLayer;
}
export interface McpCatalogQuery {
    readonly sessionId?: string;
    readonly folder?: string;
    readonly layer?: McpLayer;
}
export interface McpToggle {
    readonly layer: McpLayer;
    readonly sessionId?: string;
    readonly folder?: string;
    readonly server: string;
    readonly on: boolean;
}
export interface McpToggleAll {
    readonly layer: McpLayer;
    readonly sessionId?: string;
    readonly folder?: string;
    readonly on: boolean;
}
export interface McpInherit {
    readonly layer: McpLayer;
    readonly sessionId?: string;
    readonly folder?: string;
    readonly server: string;
}
export interface McpInheritAll {
    readonly layer: McpLayer;
    readonly sessionId?: string;
    readonly folder?: string;
}
/**
 * Attribute one global tool name to its owning MCP server.
 *
 * Public MCP names are NOT reliably parseable: serverName permits underscores
 * (including double underscores), raw tool names may contain separators, and
 * long names are truncated with an appended identity hash. The only safe
 * attribution is against the authoritative live server set (read from the
 * registry's mcp-client fibers, serverName only — never credentials).
 *
 * A name is attributed only on unique delimiter-bounded prefix match. Nested
 * servers (for example `a` and `a__b` both live) make `mcp__a__b__c`
 * genuinely ambiguous, so it is attributed to neither: hiding must never
 * remove the wrong server's tool. Unmatched names (stale, truncated-hash, or
 * scope-local registrations) are likewise never denied.
 */
export declare function attributeMcpTool(name: string, servers: readonly string[]): string | undefined;
export declare function serversFromToolNames(names: readonly string[], servers: readonly string[]): Map<string, number>;
export declare function computeDenyList(toolNames: readonly string[], hidden: ReadonlySet<string>, servers: readonly string[]): string[];
export declare class McpHub {
    readonly paths: {
        readonly storeDir: string;
    };
    constructor(paths: {
        readonly storeDir: string;
    });
    private globalPath;
    private projectPath;
    private sessionPath;
    private documentPath;
    effectiveGate(server: string, sessionId?: string, folder?: string): {
        gate: McpGate;
        source: McpLayer;
    };
    hiddenServers(sessionId?: string, folder?: string, servers?: readonly string[]): Set<string>;
    catalog(query?: McpCatalogQuery, toolNames?: readonly string[], servers?: readonly string[]): {
        servers: McpServerView[];
        layer: McpLayer;
    };
    toggle(request: McpToggle): void;
    inherit(request: McpInherit): void;
}
//# sourceMappingURL=mcp.d.ts.map