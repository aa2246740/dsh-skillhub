import { type Catalog, type HomeKind, type SkillId, type VisibilityLayer } from './catalog.ts';
export type LayerName = VisibilityLayer;
export type CatalogQuery = {
    readonly sessionId?: string;
    readonly folder?: string;
    readonly layer?: LayerName;
};
export interface HubPaths {
    readonly agentHome: string;
    readonly dshHome: string;
    readonly storeDir: string;
}
export type VisibilityTarget = {
    readonly kind: 'skill';
    readonly id: SkillId;
} | {
    readonly kind: 'group';
    readonly packHome: HomeKind;
    readonly packName: string;
    readonly rel: string;
} | {
    readonly kind: 'home';
    readonly home: HomeKind;
} | {
    readonly kind: 'ids';
    readonly ids: readonly SkillId[];
} | {
    readonly kind: 'all';
};
export type ToggleTarget = VisibilityTarget & {
    readonly on: boolean;
};
export declare class SkillHub {
    readonly paths: HubPaths;
    constructor(paths: HubPaths);
    private globalPath;
    private projectPath;
    private sessionPath;
    private documentPath;
    catalog(query?: CatalogQuery): Catalog;
    toggle(query: {
        layer: LayerName;
        sessionId?: string;
        folder?: string;
        target: ToggleTarget;
    }): Catalog;
    inherit(query: {
        layer: LayerName;
        sessionId?: string;
        folder?: string;
        target: VisibilityTarget;
    }): Catalog;
    resetSession(sessionId: string, folder?: string): Catalog;
    resetProject(folder: string): Catalog;
    install(sourceDir: string, home: HomeKind): Catalog;
}
//# sourceMappingURL=hub.d.ts.map