import { ObserverFunc } from '../common/ObserverFunc'

/**
 * A value that changes over time and notifies its observers on every change.
 * Always has a current value (read via `.value`); subscribing yields the
 * future values, not the current one.
 *
 * This is the read-only view: consumers can read and observe but not write.
 * The owner uses {@link MutableObservableValue} to assign new values.
 */
export interface ObservableValue<T> {
    readonly value: T
    subscribe(observer: object, handler: ObserverFunc<T>): void
    unsubscribe(observer: object): void
    unsubscribeAll(): void
    hasObserver(observer: object): boolean
    map<U>(mapper: (value: T) => U): ObservableValue<U>
}

/**
 * A writable {@link ObservableValue}. Returned by `observableValue()` and
 * intended to be kept private by the owner; consumers receive it typed as
 * {@link ObservableValue} so they cannot write to it.
 */
export interface MutableObservableValue<T> extends ObservableValue<T> {
    value: T
}
