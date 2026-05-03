import { ObserverFunc } from '../common/ObserverFunc'

/**
 * An event source: something observers subscribe to in order to be notified
 * when it fires. Has no current value; each notification is a discrete event.
 *
 * This is the read-only view exposed to consumers. The owner that fires the
 * event uses {@link EmittableObservable} so `notify` is hidden from the outside.
 */
export interface Observable<T = void> {
    subscribe(observer: object, handler: ObserverFunc<T>): void
    unsubscribe(observer: object): void
    unsubscribeAll(): void
    hasObserver(observer: object): boolean
    map<U>(mapper: (value: T) => U): Observable<U>
    filter(predicate: (value: T) => boolean): Observable<T>
}

/**
 * An {@link Observable} that can also be fired. Returned by `observable()`
 * and intended to be kept private by the owner; consumers receive it typed
 * as {@link Observable} so they cannot fire the event.
 */
export interface EmittableObservable<T = void> extends Observable<T> {
    notify(value?: T): Promise<void>
}
