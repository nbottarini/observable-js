import { Observable } from './Observable'

export interface ObservableProperty<T = any> extends Observable<T> {
    readonly changed: Observable<T>
    readonly value: T
}
