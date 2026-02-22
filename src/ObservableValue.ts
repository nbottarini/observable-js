import { Observable } from './Observable'

export interface ObservableValue<T = any> extends Observable<T> {
    readonly changed: Observable<T>
    readonly value: T
}
