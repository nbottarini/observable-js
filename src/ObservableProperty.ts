import { Observable } from './Observable'

export class ObservableProperty<T = any> {
    private _value: T
    readonly changed: Observable<T> = new Observable()

    constructor(initialValue: T) {
        this._value = initialValue
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
