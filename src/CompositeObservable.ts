import { Observable, ObserverFunc } from './Observable'

type EventOf<O> = O extends Observable<infer T> ? T : never

export class CompositeObservable<Sources extends readonly Observable<any>[]> implements Observable<EventOf<Sources[number]>> {
    private observers = new Set<object>()
    private handlers: Map<object, ObserverFunc<EventOf<Sources[number]>>> = new Map()
    private onSourceEventRef = this.onSourceEvent.bind(this)

    constructor(private readonly sources: Sources) {
    }

    hasObserver(observer: object): boolean {
        return this.observers.has(observer)
    }

    async notify(value?: EventOf<Sources[number]>) {
        throw new Error('CompositeObservable cannot be notified directly')
    }

    subscribe(observer: object, handler: ObserverFunc<EventOf<Sources[number]>>): void {
        const isFirstObserver = this.observers.size === 0
        this.observers.add(observer)
        this.handlers.set(observer, handler.bind(observer))

        if (isFirstObserver) this.attachToSources()
    }

    unsubscribe(observer: object): void {
        const hadObservers  = this.observers.size > 0
        this.observers.delete(observer)
        this.handlers.delete(observer)

        if (hadObservers  && this.observers.size === 0) this.detachFromSources()
    }

    unsubscribeAll(): void {
        const hadObservers  = this.observers.size > 0
        this.observers.clear()
        this.handlers.clear()
        if (hadObservers ) this.detachFromSources()
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

    private async onSourceEvent(value?: EventOf<Sources[number]>) {
        let promises = []
        for (const handler of this.handlers.values()) {
            promises.push(handler(value))
        }
        await Promise.all(promises)
    }
}

export function compositeObservable<Sources extends readonly Observable<any>[]>(...sources: Sources) {
    return new CompositeObservable(sources)
}
