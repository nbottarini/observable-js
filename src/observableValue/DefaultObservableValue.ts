import { MutableObservableValue, ObservableValue } from './ObservableValue'
import { ObserverFunc } from '../common/ObserverFunc'
import { ObserverRegistry } from '../common/ObserverRegistry'
import { observableComputed } from './ComputedObservableValue'

/**
 * Default implementation of {@link MutableObservableValue}. Holds a value and
 * notifies observers whenever it is reassigned to a different value (compared
 * with `Object.is`); reassigning to the same value is a no-op.
 */
export class DefaultObservableValue<T> implements MutableObservableValue<T> {
    private registry: ObserverRegistry<T> = new ObserverRegistry()
    private _value: T

    constructor(initialValue: T) {
        this._value = initialValue
    }

    get value(): T {
        return this._value
    }

    set value(newValue: T) {
        if (Object.is(this._value, newValue)) return
        this._value = newValue
        void this.registry.notifyAll(this._value)
    }

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

    map<U>(mapper: (value: T) => U): ObservableValue<U> {
        return observableComputed(mapper, this)
    }
}

/**
 * Creates a new {@link MutableObservableValue} initialized with the given
 * value. Expose it publicly typed as {@link ObservableValue} to make it
 * read-only from the outside.
 */
export function observableValue<T>(initialValue: T): MutableObservableValue<T> {
    return new DefaultObservableValue<T>(initialValue)
}
