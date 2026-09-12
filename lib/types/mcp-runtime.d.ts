import type { Context } from '@deepseek-ai/cordis';
import { McpHub, type McpCatalogQuery } from './mcp.ts';
interface Agent {
    id: string;
    ctx: Context;
    session?: {
        id?: string;
        header?: {
            id?: string;
            cwd?: string;
        };
    };
}
/** Uses public Cordis fiber configuration; only serverName leaves this function. */
export declare function liveMcpServers(ctx: Context): string[];
export declare function installMcpVisibility(ctx: Context, hub: McpHub, discover?: () => string[]): {
    attach: (agent: Agent) => void;
    refresh: () => void;
    catalog(query?: McpCatalogQuery): {
        servers: {
            supported: boolean;
            name: string;
            tools: number;
            gate: import("./mcp.ts").McpGate;
            source: import("./mcp.ts").McpLayer;
        }[];
        layer: import("./mcp.ts").McpLayer;
    };
    mutate(query: McpCatalogQuery, server: string, onValue?: boolean): {
        servers: {
            supported: boolean;
            name: string;
            tools: number;
            gate: import("./mcp.ts").McpGate;
            source: import("./mcp.ts").McpLayer;
        }[];
        layer: import("./mcp.ts").McpLayer;
    };
};
export {};
//# sourceMappingURL=mcp-runtime.d.ts.map