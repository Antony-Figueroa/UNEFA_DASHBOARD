import { Subscribable } from 'dexie';
import * as React from 'react';
/**
 * Subscribes to an observable and returns the latest value.
 * Suspends until the first value is received.
 *
 * Calls with the same cache key will reuse the same observable.
 * Cache key must be globally unique.
 */
export declare function useSuspendingObservable<T>(getObservable: (() => Subscribable<T>) | Subscribable<T>, cacheKey: React.DependencyList): T;
//# sourceMappingURL=useSuspendingObservable.d.ts.map