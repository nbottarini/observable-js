import { ObservableValue } from '../observableValue/ObservableValue'
import { ObservableResource, ResourceStatus } from './ObservableResource'

/**
 * An {@link ObservableResource} derived from another by mapping its `data`
 * value, while preserving the source's `status`, `error`, `isRefreshing`,
 * `whenReady()` and `refresh()`. Created via `source$.map(...)`.
 *
 * `reset()` is a no-op on a derived resource: the source$ must be reset
 * explicitly. Multiple derived resources can share the same source$.
 */
export class DerivedObservableResource<S, T> implements ObservableResource<T> {
    readonly data$: ObservableValue<T | undefined>

    constructor(
        private readonly source$: ObservableResource<S>,
        mapper: (value: S | undefined) => T | undefined,
    ) {
        this.data$ = source$.data$.map(mapper)
    }

    get status$(): ObservableValue<ResourceStatus> { return this.source$.status$ }
    get error$(): ObservableValue<Error | null> { return this.source$.error$ }
    get isRefreshing$(): ObservableValue<boolean> { return this.source$.isRefreshing$ }

    get data(): T | undefined { return this.data$.value }
    get status(): ResourceStatus { return this.source$.status }
    get error(): Error | null { return this.source$.error }
    get isRefreshing(): boolean { return this.source$.isRefreshing }

    async whenReady(): Promise<T> {
        await this.source$.whenReady()
        return this.data$.value as T
    }

    refresh(): Promise<void> {
        return this.source$.refresh()
    }

    reset() {
        // no-op: reset must be done on the source$ explicitly
    }

    map<U>(mapper: (value: T | undefined) => U | undefined): ObservableResource<U> {
        return new DerivedObservableResource<T, U>(this, mapper)
    }
}
