export interface InteropableObservable<T> {
    subscribe(onNext: (x: T) => any, onError?: (error: any) => any): AnySubscription;
    getValue?(): T;
    hasValue?(): boolean;
}
export type AnySubscription = {
    unsubscribe(): any;
} | (() => any);
export declare function useObservable<T, TDefault>(observable: InteropableObservable<T>): T | undefined;
export declare function useObservable<T, TDefault>(observable: InteropableObservable<T>, defaultResult: TDefault): T | TDefault;
export declare function useObservable<T>(observableFactory: () => InteropableObservable<T>, deps?: any[]): T | undefined;
export declare function useObservable<T, TDefault>(observableFactory: () => InteropableObservable<T>, deps: any[], defaultResult: TDefault): T | TDefault;
//# sourceMappingURL=useObservable.d.ts.map