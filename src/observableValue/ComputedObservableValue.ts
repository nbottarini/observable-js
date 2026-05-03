import { ObservableValue } from './ObservableValue'
import { ObserverFunc } from '../common/ObserverFunc'
import { ObserverRegistry } from '../common/ObserverRegistry'

type ValueOf<P> = P extends ObservableValue<infer T> ? T : never
type DepValues<Deps extends readonly ObservableValue<any>[]> = { [K in keyof Deps]: ValueOf<Deps[K]> }

/**
 * An {@link ObservableValue} whose value is derived from one or more dependent
 * observable values via a compute function. Recomputes and notifies whenever
 * any dependency changes.
 *
 * Lazy: only watches its dependencies while it has at least one observer of
 * its own. While observed, the computed value is cached; without observers,
 * the cache is invalidated and `.value` recomputes on every read.
 */
export class ComputedObservableValue<Deps extends readonly ObservableValue<any>[], T> implements ObservableValue<T> {
    private registry: ObserverRegistry<T> = new ObserverRegistry()
    private readonly deps: Deps
    private readonly onDepChangedRef = this.onDepChanged.bind(this)
    private hasCachedValue = false
    private cachedValue!: T

    constructor(
        private readonly computeFunc: (...values: DepValues<Deps>) => T,
        ...deps: Deps
    ) {
        this.deps = deps
    }

    get value(): T {
        // Without observers we don't watch deps so we recompute on every read
        if (this.registry.isEmpty()) return this.compute()

        if (!this.hasCachedValue) {
            this.cachedValue = this.compute()
            this.hasCachedValue = true
        }
        return this.cachedValue
    }

    subscribe(observer: object, handler: ObserverFunc<T>) {
        const wasEmpty = this.registry.isEmpty()
        this.registry.subscribe(observer, handler)
        if (wasEmpty) this.attachToDeps()
    }

    unsubscribe(observer: object) {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribe(observer)
        if (hadObservers && this.registry.isEmpty()) {
            this.detachFromDeps()
            this.invalidateCache()
        }
    }

    unsubscribeAll() {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribeAll()
        if (hadObservers) {
            this.detachFromDeps()
            this.invalidateCache()
        }
    }

    hasObserver(observer: object): boolean {
        return this.registry.hasObserver(observer)
    }

    map<U>(mapper: (value: T) => U): ObservableValue<U> {
        return new ComputedObservableValue<readonly [ObservableValue<T>], U>(mapper, this)
    }

    private attachToDeps() {
        for (const dep of this.deps) {
            dep.subscribe(this, this.onDepChangedRef)
        }
    }

    private detachFromDeps() {
        for (const dep of this.deps) {
            dep.unsubscribe(this)
        }
    }

    private compute(): T {
        const values = this.deps.map(d => d.value) as unknown as DepValues<Deps>
        return this.computeFunc(...values)
    }

    private async onDepChanged(): Promise<void> {
        const newValue = this.compute()
        if (this.hasCachedValue && Object.is(this.cachedValue, newValue)) return

        this.cachedValue = newValue
        this.hasCachedValue = true
        await this.registry.notifyAll(this.cachedValue)
    }

    private invalidateCache() {
        this.hasCachedValue = false
        this.cachedValue = undefined as T
    }
}

/**
 * Creates a new {@link ObservableValue} whose value is computed from the given
 * dependencies and recomputes whenever any of them changes.
 */
export function observableComputed<Deps extends readonly ObservableValue<any>[], T>(
    computeFunc: (...values: DepValues<Deps>) => T,
    ...deps: Deps
): ObservableValue<T> {
    return new ComputedObservableValue<Deps, T>(computeFunc, ...deps)
}
