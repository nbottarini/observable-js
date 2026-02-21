import { Observable, ObserverFunc } from './Observable'

export class DefaultObservable<T = void> implements Observable<T> {
    private observers: Set<object> = new Set()
    private handlers: Map<object, ObserverFunc<T>> = new Map()

    subscribe(observer: object, handler: ObserverFunc<T>) {
        this.observers.add(observer)
        this.handlers.set(observer, handler.bind(observer))
    }

    hasObserver(observer: object) {
        return this.observers.has(observer)
    }

    unsubscribe(observer: object) {
        this.observers.delete(observer)
        this.handlers.delete(observer)
    }

    unsubscribeAll() {
        this.observers.clear()
        this.handlers.clear()
    }

    async notify(value?: T) {
        let promises = []
        for (const handler of this.handlers.values()) {
            promises.push(handler(value))
        }
        await Promise.all(promises)
    }
}

export function observable<T = void>(): Observable<T> {
    return new DefaultObservable<T>()
}
