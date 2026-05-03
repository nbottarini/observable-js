import { ObservableValue } from '../observableValue/ObservableValue'

/**
 * Lifecycle state of an {@link ObservableResource}:
 * - `uninitialized`: never loaded, no fetch in progress.
 * - `loading`: the first fetch is in progress (no data yet).
 * - `ready`: data has been loaded successfully.
 * - `error`: the first fetch failed and there is no data to show.
 *
 * Note that subsequent refreshes do NOT move `status` back to `loading`. Once
 * data is available, `status` stays `ready` while a background fetch is in
 * flight; use {@link ObservableResource.isRefreshing} to detect it. This is
 * the stale-while-revalidate pattern: the UI keeps showing the cached value
 * instead of flickering.
 */
export type ResourceStatus = 'uninitialized' | 'loading' | 'ready' | 'error'

/**
 * A value produced asynchronously by some source (a remote API, a local DB, a
 * heavy computation, etc.) along with the lifecycle of that operation.
 *
 * Lazy by default: the fetch runs the first time `whenReady()` is called or
 * the resource is constructed with `{ eager: true }`. The cached value stays
 * fresh for `ttlSecs` (defaults to 60) before being refetched on next access.
 *
 * Once data has been loaded, refreshes follow the stale-while-revalidate
 * pattern: `data` keeps the previous value, `status` stays `ready`, and
 * `isRefreshing` flips to `true` while the new fetch is in flight. If a
 * background refresh fails, `error` is populated but `status` remains `ready`
 * and the cached data stays available.
 */
export interface ObservableResource<T> {
    readonly data: ObservableValue<T | undefined>
    readonly status: ObservableValue<ResourceStatus>
    readonly error: ObservableValue<Error | null>
    readonly isRefreshing: ObservableValue<boolean>
    whenReady(): Promise<T>
    refresh(): Promise<void>
    reset(): void
    map<U>(mapper: (value: T | undefined) => U | undefined): ObservableResource<U>
}

/**
 * Options for {@link ObservableResource}:
 * - `ttlSecs`: seconds the loaded value is considered fresh before being
 *   refetched on next access. Defaults to 60.
 * - `eager`: when true, the fetch is triggered on construction instead of
 *   waiting for the first `whenReady()` call. Defaults to false.
 */
export interface ResourceOptions {
    ttlSecs?: number
    eager?: boolean
}
