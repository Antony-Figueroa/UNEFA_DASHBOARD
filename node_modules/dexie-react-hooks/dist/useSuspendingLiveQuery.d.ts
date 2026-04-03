/**
 * Observe IndexedDB data in your React component. Make the component re-render when the observed data changes.
 *
 * Suspends until first value is available.
 *
 * Cache key must be globally unique.
 */
export declare function useSuspendingLiveQuery<T>(querier: () => Promise<T> | T, cacheKey: React.DependencyList): T;
//# sourceMappingURL=useSuspendingLiveQuery.d.ts.map