import { Observable, ObserverFunc } from './Observable'

type Mapper<S, T> = (value?: S) => T
type Predicate<S> = (value?: S) => boolean

export class DerivedObservable<S, T = S> implements Observable<T> {
    private observers = new Set<object>()
    private handlers: Map<object, ObserverFunc<T>> = new Map()
    private onSourceEventRef = this.onSourceEvent.bind(this)

    constructor(
        private readonly source: Observable<S>,
        private readonly predicate: Predicate<S> = () => true,
        private readonly mapper?: Mapper<S, T>,
    ) {}

    hasObserver(observer: object): boolean {
        return this.observers.has(observer)
    }

    async notify(_value?: T) {
        throw new Error('DerivedObservable cannot be notified directly')
    }

    subscribe(observer: object, handler: ObserverFunc<T>): void {
        const isFirstObserver = this.observers.size === 0

        this.observers.add(observer)
        this.handlers.set(observer, handler.bind(observer))

        if (isFirstObserver) this.attachToSource()
    }

    unsubscribe(observer: object): void {
        const hadObservers = this.observers.size > 0

        this.observers.delete(observer)
        this.handlers.delete(observer)

        if (hadObservers && this.observers.size === 0) this.detachFromSource()
    }

    unsubscribeAll(): void {
        const hadObservers = this.observers.size > 0
        this.observers.clear()
        this.handlers.clear()
        if (hadObservers) this.detachFromSource()
    }

    private attachToSource() {
        this.source.subscribe(this, this.onSourceEventRef)
    }

    private detachFromSource() {
        this.source.unsubscribe(this)
    }

    private async onSourceEvent(value?: S) {
        if (!this.predicate(value)) return

        const mapped = this.mapper ? this.mapper(value) : (value as unknown as T)

        let promises = []
        for (const handler of this.handlers.values()) {
            promises.push(handler(mapped))
        }
        await Promise.all(promises)
    }
}

export function derivedObservable<S, T = S>(
    source: Observable<S>,
    predicate: Predicate<S>,
    mapper?: Mapper<S, T>,
) {
    return new DerivedObservable<S, T>(source, predicate, mapper)
}
