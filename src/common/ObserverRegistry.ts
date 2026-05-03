import { ObserverFunc } from './ObserverFunc'

/**
 * Internal helper that holds a list of observers indexed by their owner object
 * and notifies them in parallel. Used by composition by the public observable
 * implementations so they don't have to reimplement subscribe/unsubscribe logic.
 */
export class ObserverRegistry<T> {
    private observers: Set<object> = new Set()
    private handlers: Map<object, ObserverFunc<T>> = new Map()

    subscribe(observer: object, handler: ObserverFunc<T>) {
        this.observers.add(observer)
        this.handlers.set(observer, handler.bind(observer))
    }

    unsubscribe(observer: object) {
        this.observers.delete(observer)
        this.handlers.delete(observer)
    }

    unsubscribeAll() {
        this.observers.clear()
        this.handlers.clear()
    }

    hasObserver(observer: object): boolean {
        return this.observers.has(observer)
    }

    get size(): number {
        return this.observers.size
    }

    isEmpty(): boolean {
        return this.observers.size === 0
    }

    async notifyAll(value: T): Promise<void> {
        const promises = []
        for (const handler of this.handlers.values()) {
            promises.push(handler(value))
        }
        await Promise.all(promises)
    }
}
