/**
 * Handler function invoked by an observable when it notifies its observers.
 * May be sync or async; if it returns a Promise, callers can await it.
 */
export type ObserverFunc<T> = (value: T) => any
