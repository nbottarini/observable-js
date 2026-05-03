import { Observable } from './Observable'
import { ObserverFunc } from '../common/ObserverFunc'
import { ObserverRegistry } from '../common/ObserverRegistry'
import { DerivedObservable } from './DerivedObservable'

type EventOf<O> = O extends Observable<infer T> ? T : never

/**
 * An {@link Observable} that fires whenever any of its source observables
 * fires, fanning their events into a single stream. Created via `merge(...)`.
 *
 * Lazy: only attaches to the sources while it has at least one observer of
 * its own, and detaches automatically when the last observer unsubscribes.
 */
export class CompositeObservable<Sources extends readonly Observable<any>[]> implements Observable<EventOf<Sources[number]>> {
    private registry: ObserverRegistry<EventOf<Sources[number]>> = new ObserverRegistry()
    private onSourceEventRef = this.onSourceEvent.bind(this)

    constructor(private readonly sources: Sources) {
    }

    subscribe(observer: object, handler: ObserverFunc<EventOf<Sources[number]>>) {
        const wasEmpty = this.registry.isEmpty()
        this.registry.subscribe(observer, handler)
        if (wasEmpty) this.attachToSources()
    }

    unsubscribe(observer: object) {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribe(observer)
        if (hadObservers && this.registry.isEmpty()) this.detachFromSources()
    }

    unsubscribeAll() {
        const hadObservers = !this.registry.isEmpty()
        this.registry.unsubscribeAll()
        if (hadObservers) this.detachFromSources()
    }

    hasObserver(observer: object): boolean {
        return this.registry.hasObserver(observer)
    }

    map<U>(mapper: (value: EventOf<Sources[number]>) => U): Observable<U> {
        return new DerivedObservable<EventOf<Sources[number]>, U>(this, undefined, mapper)
    }

    filter(predicate: (value: EventOf<Sources[number]>) => boolean): Observable<EventOf<Sources[number]>> {
        return new DerivedObservable<EventOf<Sources[number]>, EventOf<Sources[number]>>(this, predicate)
    }

    private attachToSources() {
        for (const source of this.sources) {
            source.subscribe(this, this.onSourceEventRef)
        }
    }

    private detachFromSources() {
        for (const source of this.sources) {
            source.unsubscribe(this)
        }
    }

    private async onSourceEvent(value: EventOf<Sources[number]>): Promise<void> {
        await this.registry.notifyAll(value)
    }
}

/**
 * Combines multiple observables into a single one that fires whenever any of
 * its sources fires.
 */
export function merge<Sources extends readonly Observable<any>[]>(...sources: Sources): Observable<EventOf<Sources[number]>> {
    return new CompositeObservable(sources)
}
