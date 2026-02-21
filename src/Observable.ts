export type ObserverFunc<T> = (subject: T) => any

export interface Observable<T> {
    subscribe(observer: object, handler: ObserverFunc<T>): void

    hasObserver(observer: object): boolean

    unsubscribe(observer: object): void

    unsubscribeAll(): void

    notify(value?: T): Promise<void>
}
