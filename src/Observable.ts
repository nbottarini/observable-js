export type ObserverFunc<T> = (subject: T) => void

export class Observable<T = void> {
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

    notify(value?: T) {
        for (const handler of this.handlers.values()) {
            // @ts-ignore
            handler(value)
        }
    }
}
