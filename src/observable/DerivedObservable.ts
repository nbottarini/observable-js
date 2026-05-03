import { Observable } from './Observable'
import { ObserverFunc } from '../common/ObserverFunc'
import { ObserverRegistry } from '../common/ObserverRegistry'

type Mapper<S, T> = (value: S) => T
type Predicate<S> = (value: S) => boolean

/**
 * An {@link Observable} derived from another by filtering and/or mapping its
 * events. Created via `source.filter(...)` and `source.map(...)`.
 *
 * Lazy: only attaches to the source while it has at least one observer of its
 * own, and detaches automatically when the last observer unsubscribes.
 */
export class DerivedObservable<S, T = S> implements Observable<T> {
    private registry: ObserverRegistry<T> = new ObserverRegistry()
    private onSourceEventRef = this.onSourceEvent.bind(this)

    constructor(
        private readonly source: Observable<S>,
        private readonly predicate?: Predicate<S>,
        private readonly mapper?: Mapper<S, T>,
    ) {}

    subscribe(observer: object, handler: ObserverFunc<T>) {
        const wasEmpty = this.registry.isEmpty()
        this.registry.subscribe(observer, handler)
        if (wasEmpty) this.source.subscribe(this, this.onSourceEventRef)
    }

    unsubscribe(observer: object) {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribe(observer)
        if (hadObservers && this.registry.isEmpty()) this.source.unsubscribe(this)
    }

    unsubscribeAll() {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribeAll()
        if (hadObservers) this.source.unsubscribe(this)
    }

    hasObserver(observer: object): boolean {
        return this.registry.hasObserver(observer)
    }

    map<U>(mapper: (value: T) => U): Observable<U> {
        return new DerivedObservable<T, U>(this, undefined, mapper)
    }

    filter(predicate: (value: T) => boolean): Observable<T> {
        return new DerivedObservable<T, T>(this, predicate)
    }

    private async onSourceEvent(value: S): Promise<void> {
        if (this.predicate && !this.predicate(value)) return
        const mapped = this.mapper ? this.mapper(value) : (value as unknown as T)
        await this.registry.notifyAll(mapped)
    }
}
