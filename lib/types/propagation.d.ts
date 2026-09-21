export interface PropagationMetadata {
    readonly defaultRevision?: number;
    readonly gateRevisions?: Readonly<Record<string, number>>;
}
type Layer = 'global' | 'project' | 'session';
type Gate = 'on' | 'off';
type Document = PropagationMetadata & {
    readonly default: Gate | 'inherit';
    readonly gates: Readonly<Record<string, Gate | 'inherit'>>;
};
/** Legacy documents retain their current values until the next relevant write. */
export declare function readPropagationMetadata(raw: object, path: string): PropagationMetadata;
/** Synchronous Host mutations share a durable clock, including across hot reloads. */
export declare function nextPropagationRevision(storeDir: string): number;
/**
 * Newer ancestor operations replace older local values, without copying or
 * enumerating sessions. A later local operation changes only that scope.
 * Only the queried project's chain participates; siblings can never win.
 */
export declare function propagatedGate(id: string | undefined, layers: readonly (readonly [Layer, Document | undefined])[]): {
    gate: Gate;
    source: Layer;
};
export {};
//# sourceMappingURL=propagation.d.ts.map