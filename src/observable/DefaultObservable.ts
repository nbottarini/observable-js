import { EmittableObservable, Observable } from './Observable'
import { ObserverFunc } from '../common/ObserverFunc'
import { ObserverRegistry } from '../common/ObserverRegistry'
import { DerivedObservable } from './DerivedObservable'

/**
 * Default implementation of {@link EmittableObservable}. The owner calls
 * `notify()` to fire the event; subscribers registered via `subscribe()` are
 * invoked in parallel and `notify()` resolves when all of them have settled.
 */
export class DefaultObservable<T = void> implements EmittableObservable<T> {
    private registry: ObserverRegistry<T> = new ObserverRegistry()

    subscribe(observer: object, handler: ObserverFunc<T>) {
        this.registry.subscribe(observer, handler)
    }

    unsubscribe(observer: object) {
        this.registry.unsubscribe(observer)
    }

    unsubscribeAll() {
        this.registry.unsubscribeAll()
    }

    hasObserver(observer: object): boolean {
        return this.registry.hasObserver(observer)
    }

    async notify(value?: T): Promise<void> {
        await this.registry.notifyAll(value as T)
    }

    map<U>(mapper: (value: T) => U): Observable<U> {
        return new DerivedObservable<T, U>(this, undefined, mapper)
    }

    filter(predicate: (value: T) => boolean): Observable<T> {
        return new DerivedObservable<T, T>(this, predicate)
    }
}

/**
 * Creates a new {@link EmittableObservable}. Use it to declare events as
 * properties on a class; expose them publicly typed as {@link Observable} to
 * keep `notify` hidden from consumers.
 */
export function observable<T = void>(): EmittableObservable<T> {
    return new DefaultObservable<T>()
}
