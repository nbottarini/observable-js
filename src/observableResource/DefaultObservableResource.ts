import { MutableObservableValue, ObservableValue } from '../observableValue/ObservableValue'
import { observableValue } from '../observableValue/DefaultObservableValue'
import { ObservableResource, ResourceOptions, ResourceStatus } from './ObservableResource'
import { DerivedObservableResource } from './DerivedObservableResource'

const DEFAULT_TTL_SECS = 60

/**
 * Default implementation of {@link ObservableResource}. Wraps an async fetch
 * function and exposes its result as observable values for data, status,
 * error and refresh state.
 *
 * Concurrent calls to `whenReady()` share the same in-flight fetch.
 * `refresh()` always triggers a new fetch and follows the stale-while-
 * revalidate pattern when data is already available. `reset()` returns the
 * resource to `uninitialized` and discards any in-flight result via a
 * generation counter.
 */
export class DefaultObservableResource<T> implements ObservableResource<T> {
    private readonly _data$: MutableObservableValue<T | undefined> = observableValue<T | undefined>(undefined)
    private readonly _status$: MutableObservableValue<ResourceStatus> = observableValue<ResourceStatus>('uninitialized')
    private readonly _error$: MutableObservableValue<Error | null> = observableValue<Error | null>(null)
    private readonly _isRefreshing$: MutableObservableValue<boolean> = observableValue(false)
    private readonly ttlSecs: number
    private lastFetchedAtMs: number | null = null
    private fetching: Promise<void> | null = null
    private generation = 0

    constructor(private readonly fetchFunc: () => Promise<T>, options: ResourceOptions = {}) {
        this.ttlSecs = options.ttlSecs ?? DEFAULT_TTL_SECS
        if (options.eager) void this.load()
    }

    get data$(): ObservableValue<T | undefined> { return this._data$ }
    get status$(): ObservableValue<ResourceStatus> { return this._status$ }
    get error$(): ObservableValue<Error | null> { return this._error$ }
    get isRefreshing$(): ObservableValue<boolean> { return this._isRefreshing$ }

    get data(): T | undefined { return this._data$.value }
    get status(): ResourceStatus { return this._status$.value }
    get error(): Error | null { return this._error$.value }
    get isRefreshing(): boolean { return this._isRefreshing$.value }

    async whenReady(): Promise<T> {
        if (this._status$.value === 'ready') {
            // Stale data: trigger a background refresh, but return current value immediately
            if (!this.isFresh() && !this.fetching) void this.load(true)
            return this._data$.value as T
        }

        await this.load()

        if (this._status$.value === 'error') throw this._error$.value
        return this._data$.value as T
    }

    async refresh(): Promise<void> {
        const startGeneration = this.generation
        await this.load(true)
        if (this.generation !== startGeneration) return
        if (this._error$.value) throw this._error$.value
    }

    reset() {
        this.generation++
        this._data$.value = undefined
        this._error$.value = null
        this._status$.value = 'uninitialized'
        this._isRefreshing$.value = false
        this.lastFetchedAtMs = null
        this.fetching = null
    }

    map<U>(mapper: (value: T | undefined) => U | undefined): ObservableResource<U> {
        return new DerivedObservableResource<T, U>(this, mapper)
    }

    private async load(force = false): Promise<void> {
        if (this.fetching) return this.fetching
        if (!force && this._status$.value === 'ready' && this.isFresh()) return

        const startGeneration = this.generation
        const hasData = this._data$.value !== undefined

        // Stale-while-revalidate: only show 'loading' when we have no data to display
        if (hasData) {
            this._isRefreshing$.value = true
        } else {
            this._status$.value = 'loading'
        }
        this._error$.value = null

        this.fetching = (async () => {
            try {
                const value = await this.fetchFunc()
                if (this.generation !== startGeneration) return

                this._data$.value = value
                this.lastFetchedAtMs = Date.now()
                this._status$.value = 'ready'
            } catch (e) {
                if (this.generation !== startGeneration) return

                this._error$.value = e instanceof Error ? e : new Error(String(e))
                // Only flip to 'error' when there is no cached data to keep showing
                if (!hasData) this._status$.value = 'error'
            } finally {
                if (this.generation === startGeneration) {
                    this._isRefreshing$.value = false
                    this.fetching = null
                }
            }
        })()
        return this.fetching
    }

    private isFresh(): boolean {
        if (this.lastFetchedAtMs === null) return false
        return Date.now() - this.lastFetchedAtMs < this.ttlSecs * 1000
    }
}

/**
 * Creates a new {@link ObservableResource} backed by the given async fetch
 * function. See {@link ResourceOptions} for `ttlSecs` and `eager` options.
 */
export function observableResource<T>(fetch: () => Promise<T>, options?: ResourceOptions): ObservableResource<T> {
    return new DefaultObservableResource<T>(fetch, options)
}
