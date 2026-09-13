export declare function isHostSkillName(name: string): boolean;
export type HomeKind = 'agent' | 'dsh';
export type Gate = 'on' | 'off';
export type VisibilityLayer = 'global' | 'project' | 'session';
export type LayerGate = Gate | 'inherit';
export type GroupGate = 'on' | 'off' | 'mixed';
export type AbsolutePath = string;
export type SkillId = string & {
    readonly __brand: 'SkillId';
};
export type PackId = string & {
    readonly __brand: 'PackId';
};
export type VisibilityDocument = {
    readonly version: 2;
    readonly default: LayerGate;
    readonly gates: Readonly<Record<string, LayerGate>>;
    readonly legacySnapshot?: boolean;
};
export declare const VisibilityDocument: {
    readonly empty: () => VisibilityDocument;
    readonly global: (defaultGate?: Gate) => VisibilityDocument;
    readonly off: (ids: readonly SkillId[]) => VisibilityDocument;
    readonly on: (ids: readonly SkillId[]) => VisibilityDocument;
};
export declare function skillId(home: HomeKind, relPath: string): SkillId;
export declare function packId(home: HomeKind, name: string): PackId;
export declare function parseSkillId(id: SkillId): {
    home: HomeKind;
    relPath: string;
};
export type BrokenReason = {
    readonly kind: 'missing-symlink-target';
    readonly target: string;
} | {
    readonly kind: 'unreadable-skill';
    readonly message: string;
} | {
    readonly kind: 'invalid-frontmatter';
    readonly message: string;
} | {
    readonly kind: 'invalid-name';
    readonly raw: string;
} | {
    readonly kind: 'empty-pack';
};
export interface BrokenEntry {
    readonly home: HomeKind;
    readonly path: AbsolutePath;
    readonly reason: BrokenReason;
}
export interface OfferedSkill {
    readonly id: SkillId;
    readonly name: string;
    readonly description: string;
    readonly whenToUse?: string;
    readonly home: HomeKind;
    readonly path: AbsolutePath;
    readonly directory: AbsolutePath;
    readonly invocation: {
        readonly modelInvocable: boolean;
        readonly userInvocable: boolean;
    };
    readonly content: string;
}
export interface ManagedSkill extends OfferedSkill {
    readonly gate: Gate;
    readonly source: VisibilityLayer;
}
export interface Collision {
    readonly name: string;
    readonly skills: readonly SkillId[];
}
export interface SkillNode {
    readonly kind: 'skill';
    readonly id: SkillId;
    readonly name: string;
    readonly description: string;
    readonly home: HomeKind;
    readonly path: AbsolutePath;
    readonly gate: Gate;
    readonly source: VisibilityLayer;
    readonly collision: boolean;
}
export interface BrokenNode {
    readonly kind: 'broken';
    readonly home: HomeKind;
    readonly name: string;
    readonly path: AbsolutePath;
    readonly reason: BrokenReason;
}
export interface GroupNode {
    readonly kind: 'group';
    readonly home: HomeKind;
    readonly name: string;
    readonly rel: string;
    readonly path: AbsolutePath;
    readonly gate: GroupGate;
    readonly skill: SkillNode | null;
    readonly children: readonly FolderChild[];
}
export type FolderChild = GroupNode | BrokenNode;
export interface PackNode {
    readonly kind: 'pack';
    readonly id: PackId;
    readonly home: HomeKind;
    readonly name: string;
    readonly path: AbsolutePath;
    readonly link: {
        kind: 'symlink';
        target: string;
    } | {
        kind: 'directory';
    } | {
        kind: 'broken-symlink';
        target: string;
    };
    readonly gate: GroupGate;
    readonly skill: SkillNode | null;
    readonly children: readonly FolderChild[];
}
export interface RootSkillNode {
    readonly kind: 'root-skill';
    readonly id: SkillId;
    readonly name: string;
    readonly description: string;
    readonly home: HomeKind;
    readonly path: AbsolutePath;
    readonly gate: Gate;
    readonly source: VisibilityLayer;
    readonly collision: boolean;
}
export type CatalogNode = PackNode | RootSkillNode | BrokenNode;
export interface HomeRoot {
    readonly kind: 'home';
    readonly home: HomeKind;
    readonly path: AbsolutePath;
    readonly children: readonly CatalogNode[];
}
export interface Catalog {
    readonly offered: readonly OfferedSkill[];
    readonly inventory: readonly ManagedSkill[];
    readonly tree: readonly HomeRoot[];
    readonly collisions: readonly Collision[];
    readonly broken: readonly BrokenEntry[];
    readonly layer?: VisibilityLayer;
    readonly legacySessionSnapshot?: boolean;
}
export interface ResolveInput {
    readonly agentHome: AbsolutePath;
    readonly dshHome: AbsolutePath;
    readonly global?: VisibilityDocument;
    readonly project?: VisibilityDocument;
    readonly session?: VisibilityDocument;
}
export declare function resolveCatalog(input: ResolveInput): Catalog;
export declare function findGroupByRel(node: PackNode | GroupNode, rel: string): PackNode | GroupNode | undefined;
export declare function descendantSkillIds(node: PackNode | GroupNode): SkillId[];
export declare function collectSkillGates(tree: readonly HomeRoot[]): {
    id: SkillId;
    gate: Gate;
}[];
//# sourceMappingURL=catalog.d.ts.map