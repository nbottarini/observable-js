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
 * Lazy: only watches its dependencies (via subscriptions) while it has at
 * least one observer of its own. Without observers it is not notified of
 * dep changes — but on every `.value` read it captures the current dep
 * values and compares them with those used in the last computation. If
 * unchanged, it returns the cached result; if changed, it recomputes and
 * updates the cache.
 *
 * The dep-equality check keeps the returned reference stable across reads
 * when nothing has changed, which matters for callers that use `Object.is`
 * to detect changes (e.g. when the compute function returns a fresh array
 * or object on every call).
 */
export class ComputedObservableValue<Deps extends readonly ObservableValue<any>[], T> implements ObservableValue<T> {
    private registry: ObserverRegistry<T> = new ObserverRegistry()
    private readonly deps: Deps
    private readonly onDepChangedRef = this.onDepChanged.bind(this)
    private hasCachedValue = false
    private cachedValue!: T
    private lastDepValues?: DepValues<Deps>

    constructor(
        private readonly computeFunc: (...values: DepValues<Deps>) => T,
        ...deps: Deps
    ) {
        this.deps = deps
    }

    get value(): T {
        const currentDepValues = this.readDepValues()
        if (this.hasCachedValue && this.depsEqual(currentDepValues)) {
            return this.cachedValue
        }
        return this.recomputeAndCache(currentDepValues)
    }

    subscribe(observer: object, handler: ObserverFunc<T>) {
        const wasEmpty = this.registry.isEmpty()
        this.registry.subscribe(observer, handler)
        if (wasEmpty) this.attachToDeps()
    }

    unsubscribe(observer: object) {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribe(observer)
        if (hadObservers && this.registry.isEmpty()) this.detachFromDeps()
    }

    unsubscribeAll() {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribeAll()
        if (hadObservers) this.detachFromDeps()
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

    private readDepValues(): DepValues<Deps> {
        return this.deps.map(d => d.value) as unknown as DepValues<Deps>
    }

    private recomputeAndCache(depValues: DepValues<Deps>): T {
        this.cachedValue = this.computeFunc(...depValues)
        this.lastDepValues = depValues
        this.hasCachedValue = true
        return this.cachedValue
    }

    private depsEqual(current: DepValues<Deps>): boolean {
        if (!this.lastDepValues) return false
        if (this.lastDepValues.length !== current.length) return false
        for (let i = 0; i < current.length; i++) {
            if (!Object.is(this.lastDepValues[i], current[i])) return false
        }
        return true
    }

    private async onDepChanged(): Promise<void> {
        const currentDepValues = this.readDepValues()
        if (this.hasCachedValue && this.depsEqual(currentDepValues)) return

        const previousValue = this.cachedValue
        const hadCache = this.hasCachedValue
        this.recomputeAndCache(currentDepValues)
        if (hadCache && Object.is(previousValue, this.cachedValue)) return

        await this.registry.notifyAll(this.cachedValue)
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
