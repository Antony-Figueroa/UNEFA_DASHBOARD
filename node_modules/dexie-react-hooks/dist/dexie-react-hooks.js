(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('dexie'), require('react')) :
    typeof define === 'function' && define.amd ? define(['exports', 'dexie', 'react'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.DexieReactHooks = {}, global.Dexie, global.React));
})(this, (function (exports, dexie, React) { 'use strict';

    function _interopNamespaceDefault(e) {
        var n = Object.create(null);
        if (e) {
            Object.keys(e).forEach(function (k) {
                if (k !== 'default') {
                    var d = Object.getOwnPropertyDescriptor(e, k);
                    Object.defineProperty(n, k, d.get ? d : {
                        enumerable: true,
                        get: function () { return e[k]; }
                    });
                }
            });
        }
        n.default = e;
        return Object.freeze(n);
    }

    var React__namespace = /*#__PURE__*/_interopNamespaceDefault(React);

    function useObservable(observableFactory, arg2, arg3) {
        // Resolve vars from overloading variants of this function:
        let deps;
        let defaultResult;
        if (typeof observableFactory === 'function') {
            deps = arg2 || [];
            defaultResult = arg3;
        }
        else {
            deps = [];
            defaultResult = arg2;
        }
        // Create a ref that keeps the state we need
        const monitor = React.useRef({
            hasResult: false,
            result: defaultResult,
            error: null,
        });
        // We control when component should rerender. Make triggerUpdate
        // as examplified on React's docs at:
        // https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
        const [_, triggerUpdate] = React.useReducer((x) => x + 1, 0);
        // Memoize the observable based on deps
        const observable = React.useMemo(() => {
            // Make it remember previous subscription's default value when
            // resubscribing.
            const observable = typeof observableFactory === 'function'
                ? observableFactory()
                : observableFactory;
            if (!observable || typeof observable.subscribe !== 'function') {
                if (observableFactory === observable) {
                    throw new TypeError(`Given argument to useObservable() was neither a valid observable nor a function.`);
                }
                else {
                    throw new TypeError(`Observable factory given to useObservable() did not return a valid observable.`);
                }
            }
            if (!monitor.current.hasResult &&
                typeof window !== 'undefined' // Don't do this in SSR
            ) {
                // Optimize for BehaviorSubject and other observables implementing getValue():
                if (typeof observable.hasValue !== 'function' || observable.hasValue()) {
                    if (typeof observable.getValue === 'function') {
                        monitor.current.result = observable.getValue();
                        monitor.current.hasResult = true;
                    }
                    else {
                        // Find out if the observable has a current value: try get it by subscribing and
                        // unsubscribing synchronously
                        const subscription = observable.subscribe((val) => {
                            monitor.current.result = val;
                            monitor.current.hasResult = true;
                        });
                        // Unsubscribe directly. We only needed any synchronous value if it was possible.
                        if (typeof subscription === 'function') {
                            subscription();
                        }
                        else {
                            subscription.unsubscribe();
                        }
                    }
                }
            }
            return observable;
        }, deps);
        // Integrate with react devtools:
        React.useDebugValue(monitor.current.result);
        // Subscribe to the observable
        React.useEffect(() => {
            const subscription = observable.subscribe((val) => {
                const { current } = monitor;
                if (current.error !== null || current.result !== val) {
                    current.error = null;
                    current.result = val;
                    current.hasResult = true;
                    triggerUpdate();
                }
            }, (err) => {
                const { current } = monitor;
                if (current.error !== err) {
                    current.error = err;
                    triggerUpdate();
                }
            });
            return typeof subscription === 'function'
                ? subscription // Support observables that return unsubscribe directly
                : subscription.unsubscribe.bind(subscription);
        }, deps);
        // Throw if observable has emitted error so that
        // an ErrorBoundrary can catch it
        if (monitor.current.error)
            throw monitor.current.error;
        // Return the current result
        return monitor.current.result;
    }

    function useLiveQuery(querier, deps, defaultResult) {
        return useObservable(() => dexie.Dexie.liveQuery(querier), deps || [], defaultResult);
    }

    function usePermissions(firstArg, table, obj) {
        if (!firstArg)
            throw new TypeError(`Invalid arguments to usePermissions(): undefined or null`);
        let db;
        if (arguments.length >= 3) {
            if (!('transaction' in firstArg)) {
                // Using ducktyping instead of instanceof in case there are multiple Dexie modules in app.
                // First arg is  ensures first arg is a Dexie instance
                throw new TypeError(`Invalid arguments to usePermission(db, table, obj): 1st arg must be a Dexie instance`);
            }
            if (typeof table !== 'string')
                throw new TypeError(`Invalid arguments to usePermission(db, table, obj): 2nd arg must be string`);
            if (!obj || typeof obj !== 'object')
                throw new TypeError(`Invalid arguments to usePermission(db, table, obj): 3rd arg must be an object`);
            db = firstArg;
        }
        else {
            if (firstArg instanceof dexie.Dexie)
                throw new TypeError(`Invalid arguments to usePermission(db, table, obj): Missing table and obj arguments.`);
            if (typeof firstArg.table === 'function' &&
                typeof firstArg.db === 'object') {
                db = firstArg.db;
                obj = firstArg;
                table = firstArg.table();
            }
            else {
                throw new TypeError(`Invalid arguments to usePermissions(). ` +
                    `Expected usePermissions(entity: DexieCloudEntity) or ` +
                    `usePermissions(db: Dexie, table: string, obj: DexieCloudObject)`);
            }
        }
        if (!('cloud' in db))
            throw new Error(`usePermissions() is only for Dexie Cloud but there's no dexie-cloud-addon active in given db.`);
        if (!('permissions' in db.cloud))
            throw new Error(`usePermissions() requires a newer version of dexie-cloud-addon. Please upgrade it.`);
        return useObservable(
        // @ts-ignore
        () => db.cloud.permissions(obj, table), [obj.realmId, obj.owner, table]);
    }

    const gracePeriod = 100; // 100 ms = grace period to optimize for unload/reload scenarios
    const fr = typeof FinalizationRegistry !== 'undefined' && new FinalizationRegistry((doc) => {
        // If coming here, react effect never ran. This is a fallback cleanup mechanism.
        const DexieYProvider = dexie.Dexie['DexieYProvider'];
        if (DexieYProvider)
            DexieYProvider.release(doc);
    });
    function useDocument(doc) {
        if (!fr)
            throw new TypeError('FinalizationRegistry not supported.');
        const providerRef = React.useRef(null);
        const DexieYProvider = dexie.Dexie['DexieYProvider'];
        if (!DexieYProvider) {
            throw new Error('DexieYProvider is not available. Make sure `y-dexie` is installed and imported.');
        }
        let unregisterToken = undefined;
        if (doc) {
            if (doc !== providerRef.current?.doc) {
                providerRef.current = DexieYProvider.load(doc, { gracePeriod });
                unregisterToken = Object.create(null);
                fr.register(providerRef, doc, unregisterToken);
            }
        }
        else if (providerRef.current?.doc) {
            providerRef.current = null;
        }
        React.useEffect(() => {
            if (doc) {
                // Doc is set or changed. Unregister provider from FinalizationRegistry
                // and instead take over from here to release the doc when component is unmounted
                // or when doc is changed. What we're doing here is to avoid relying on FinalizationRegistry
                // in all the normal cases and instead rely on React's lifecycle to release the doc.
                // But there can be situations when react never calls this effect and therefore, we
                // need to rely on FinalizationRegistry to release the doc as a fallback.
                // We cannot wait with loading the document until the effect happens, because the doc
                // could have been destroyed in the meantime.
                if (unregisterToken)
                    fr.unregister(unregisterToken);
                let provider = DexieYProvider.for(doc);
                if (provider) {
                    return () => {
                        DexieYProvider.release(doc);
                    };
                }
                else {
                    // Maybe the doc was destroyed in the meantime.
                    // Can not happen if React and FinalizationRegistry works as we expect them to.
                    // Except if a user had called DexieYProvider.release() on the doc
                    throw new Error(`FATAL. DexieYProvider.release() has been called somewhere in application code, making us lose the document.`);
                }
            }
        }, [doc, unregisterToken]);
        return providerRef.current;
    }

    /** {@link React.use} if supported, else fallback */
    const reactUse = Reflect.get(React__namespace, 'use');
    const usePromise = reactUse ?? fallbackUsePromise;
    /** Fallback for `React.use` with promise */
    function fallbackUsePromise(promise) {
        const state = PROMISE_STATE_MAP.get(promise);
        if (!state) {
            PROMISE_STATE_MAP.set(promise, { status: 'pending' });
            promise.then((value) => {
                PROMISE_STATE_MAP.set(promise, { status: 'fulfilled', value });
            }, (reason) => {
                PROMISE_STATE_MAP.set(promise, { status: 'rejected', reason });
            });
            throw promise;
        }
        switch (state.status) {
            case 'pending':
                throw promise;
            case 'rejected':
                throw state.reason;
            case 'fulfilled':
                return state.value;
        }
    }
    const PROMISE_STATE_MAP = new WeakMap();

    const observableCache = new Map();
    const promiseCache = new WeakMap();
    const valueCache = new WeakMap();
    const CLEANUP_DELAY = 3000; // Time to wait before cleaning up unused observables
    /**
     * Subscribes to an observable and returns the latest value.
     * Suspends until the first value is received.
     *
     * Calls with the same cache key will reuse the same observable.
     * Cache key must be globally unique.
     */
    function useSuspendingObservable(getObservable, cacheKey) {
        let observable;
        // Try to find an existing observable for this cache key
        for (const [key, value] of observableCache) {
            if (key.length === cacheKey.length &&
                key.every((k, i) => Object.is(k, cacheKey[i]))) {
                observable = value;
                break;
            }
        }
        // If no observable was found, create a new one
        if (!observable) {
            // Create a multicast observable which subscribes to source at most once.
            const source = typeof getObservable === 'function' ? getObservable() : getObservable;
            let subscription;
            const observers = new Set();
            let timeout;
            const newObservable = {
                subscribe: (observer) => {
                    observers.add(observer);
                    // Cancel the cleanup timer if it's running
                    if (timeout != null) {
                        clearTimeout(timeout);
                        timeout = undefined;
                    }
                    // If this is the first subscriber, subscribe to the source observable
                    if (!subscription) {
                        subscription = source.subscribe({
                            next: (val) => {
                                valueCache.set(newObservable, val);
                                // Clone observers in case the list changes during emission
                                for (const obs of new Set(observers))
                                    obs.next?.(val);
                            },
                            error: (err) => {
                                const lastObservers = new Set(observers);
                                handleFinalize();
                                for (const obs of lastObservers)
                                    obs.error?.(err);
                            },
                            complete: () => {
                                const lastObservers = new Set(observers);
                                handleFinalize();
                                for (const obs of lastObservers)
                                    obs.complete?.();
                            },
                        });
                    }
                    // Otherwise, emit the current value to the new subscriber if any
                    else if (valueCache.has(newObservable)) {
                        observer.next?.(valueCache.get(newObservable));
                    }
                    // Return the unsubscriber
                    return {
                        unsubscribe: () => {
                            if (!observers.has(observer))
                                return;
                            observers.delete(observer);
                            // If this was the last subscriber, schedule cleanup
                            if (observers.size === 0)
                                scheduleCleanup();
                        },
                    };
                    function handleFinalize() {
                        // Reset this observable to the initial state
                        subscription = undefined;
                        observers.clear();
                        valueCache.delete(newObservable);
                        promiseCache.delete(newObservable);
                        // Schedule cleanup in case nobody subscribes again
                        scheduleCleanup();
                    }
                    function scheduleCleanup() {
                        if (timeout != null)
                            return; // Cleanup already scheduled
                        timeout = setTimeout(() => {
                            // Unsubscribe source if any
                            subscription?.unsubscribe();
                            subscription = undefined;
                            // Remove this observable from cache
                            for (const [key, value] of observableCache) {
                                if (value === newObservable) {
                                    observableCache.delete(key);
                                    break;
                                }
                            }
                        }, CLEANUP_DELAY);
                    }
                },
            };
            observable = newObservable;
            observableCache.set(cacheKey, newObservable);
        }
        // Get or initialize promise for first value
        let promise = promiseCache.get(observable);
        if (!promise) {
            promise = new Promise((resolve, reject) => {
                const subscription = observable.subscribe({
                    next: (val) => {
                        resolve(val);
                        // Unsubscribe in next tick because subscription might not be assigned yet
                        queueMicrotask(() => subscription.unsubscribe());
                    },
                    error: (err) => reject(err),
                });
            });
            promiseCache.set(observable, promise);
        }
        const initialValue = usePromise(promise);
        const value = React__namespace.useRef(initialValue);
        const [error, setError] = React__namespace.useState();
        const rerender = React__namespace.useReducer((x) => x + 1, 0)[1];
        // Set the value immediately on every render.
        // This avoids waiting for effect to run.
        value.current = valueCache.has(observable)
            ? valueCache.get(observable)
            : initialValue;
        // Subscribe to live updates until the source observable changes.
        React__namespace.useEffect(() => {
            const subscription = observable.subscribe({
                next: (val) => {
                    if (!Object.is(val, value.current)) {
                        value.current = val;
                        rerender();
                    }
                },
                error: (err) => setError(err),
            });
            return () => subscription.unsubscribe();
        }, [observable]);
        if (error)
            throw error;
        return value.current;
    }

    /**
     * Observe IndexedDB data in your React component. Make the component re-render when the observed data changes.
     *
     * Suspends until first value is available.
     *
     * Cache key must be globally unique.
     */
    function useSuspendingLiveQuery(querier, cacheKey) {
        return useSuspendingObservable(() => dexie.Dexie.liveQuery(querier), ['dexie', ...cacheKey]);
    }

    exports.useDocument = useDocument;
    exports.useLiveQuery = useLiveQuery;
    exports.useObservable = useObservable;
    exports.usePermissions = usePermissions;
    exports.useSuspendingLiveQuery = useSuspendingLiveQuery;
    exports.useSuspendingObservable = useSuspendingObservable;

}));
//# sourceMappingURL=dexie-react-hooks.js.map
