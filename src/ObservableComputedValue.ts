import { ObservableValue } from './ObservableValue'
import { Observable, ObserverFunc } from './Observable'
import { compositeObservable } from './CompositeObservable'
import { observable } from './DefaultObservable'

type ValueOf<P> = P extends ObservableValue<infer T> ? T : never

export class ObservableComputedValue<Deps extends readonly ObservableValue<any>[], T> implements ObservableValue<T> {
    private readonly internalChanged = observable<T>()
    readonly changed: Observable<T> = {
        subscribe: (o, h) => this.subscribe(o, h),
        hasObserver: (o) => this.hasObserver(o),
        unsubscribe: (o) => this.unsubscribe(o),
        unsubscribeAll: () => this.unsubscribeAll(),
        notify: (v) => this.notify(v),
    }
    private readonly depsChanged: Observable<any>
    private readonly deps: Deps
    private readonly onDepsChangedRef = this.onDepsChanged.bind(this)
    private observerCount = 0
    private hasValue = false
    private cachedValue!: T

    constructor(private readonly computeFunc: (...values: { [K in keyof Deps]: ValueOf<Deps[K]> }) => T, ...deps: Deps) {
        this.deps = deps
        const sources = deps.map(it => it.changed)
        this.depsChanged = compositeObservable(...sources)
    }

    subscribe(observer: object, handler: ObserverFunc<any>) {
        const observerAlreadySubscribed = this.hasObserver(observer)
        const isFirstObserver = this.observerCount === 0
        this.internalChanged.subscribe(observer, handler)
        if (!observerAlreadySubscribed) {
            this.observerCount++
        }
        if (isFirstObserver) this.depsChanged.subscribe(this, this.onDepsChangedRef)
    }

    hasObserver(observer: object): boolean {
        return this.internalChanged.hasObserver(observer)
    }

    unsubscribe(observer: object) {
        if (!this.internalChanged.hasObserver(observer)) return

        this.internalChanged.unsubscribe(observer)
        this.observerCount--

        if (this.observerCount === 0) this.depsChanged.unsubscribe(this)
    }

    unsubscribeAll() {
        const hadObservers = this.observerCount > 0
        this.internalChanged.unsubscribeAll()
        this.observerCount = 0
        if (hadObservers) this.depsChanged.unsubscribe(this)
    }

    async notify(value?: any): Promise<void> {
        throw new Error('ComputedProperty cannot be notified directly')
    }

    get value(): T {
        // When there are no observers we must recompute on each call because we aren't watching dep changes
        if (this.observerCount === 0) return this.compute()

        if (!this.hasValue) {
            this.cachedValue = this.compute()
            this.hasValue = true
        }
        return this.cachedValue
    }

    private compute(): T {
        const values = this.deps.map(d => d.value) as { [K in keyof Deps]: ValueOf<Deps[K]> }
        return this.computeFunc(...values)
    }

    private onDepsChanged() {
        const newValue = this.compute()

        if (!this.hasValue || !Object.is(this.cachedValue, newValue)) {
            this.cachedValue = newValue
            this.hasValue = true
            this.internalChanged.notify(this.cachedValue)
        }
    }

    map<S>(mapper: (v:T) => S): ObservableValue<S> {
        return observableComputed(mapper, this)
    }
}

export function observableComputed<
    Deps extends readonly ObservableValue<any>[],
    T,
>(computeFunc: (...values: { [K in keyof Deps]: ValueOf<Deps[K]> }) => T, ...deps: Deps) {
    return new ObservableComputedValue(computeFunc, ...deps)
}
