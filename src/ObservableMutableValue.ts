import { observable } from './DefaultObservable'
import { ObserverFunc } from './Observable'
import { ObservableValue } from './ObservableValue'

export class ObservableMutableValue<T> implements ObservableValue<T> {
    private _value: T
    readonly changed = observable<T>()

    constructor(initialValue: T) {
        this._value = initialValue
    }

    subscribe(observer: object, handler: ObserverFunc<T>) {
        this.changed.subscribe(observer, handler)
    }
    hasObserver(observer: object): boolean {
        return this.changed.hasObserver(observer)
    }
    unsubscribe(observer: object) {
        this.changed.unsubscribe(observer)
    }
    unsubscribeAll() {
        this.changed.unsubscribeAll()
    }

    async notify(value?: T): Promise<void> {
        return this.changed.notify(value)
    }

    get value(): T {
        return this._value
    }

    set value(newValue: T) {
        if (this._value === newValue) return
        this._value = newValue
        this.changed.notify(this._value)
    }
}

export function observableValue<T>(initialValue: T): ObservableMutableValue<T> {
    return new ObservableMutableValue<T>(initialValue)
}
