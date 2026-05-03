[![npm](https://img.shields.io/npm/v/@nbottarini/observable.svg)](https://www.npmjs.com/package/@nbottarini/observable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Status](https://github.com/nbottarini/observable-js/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/nbottarini/observable-js/actions)

# Observable-Js

Tiny observable pattern primitives for TypeScript / JavaScript. No dependencies, no DOM, no React — pure patterns you can use in any layer of your app and test in isolation.

The library exposes three primitives:

- **`Observable<T>`** — events as properties.
- **`ObservableValue<T>`** — values that change and notify their observers.
- **`ObservableResource<T>`** — values produced by an asynchronous source, with a load/ready/error lifecycle.

## Installation

Npm:
```
$ npm install --save @nbottarini/observable
```

Yarn:
```
$ yarn add @nbottarini/observable
```

## Observables (events)

`observable<T>()` returns an `EmittableObservable<T>` that the owner uses to fire events. Consumers should only see it as `Observable<T>`, which doesn't include `notify` — that way only the owner can fire the event.

```typescript
import { observable, Observable } from '@nbottarini/observable'

class Button {
    private readonly _clicked = observable<ClickEvent>()
    public readonly clicked: Observable<ClickEvent> = this._clicked

    private onClick(e: ClickEvent) {
        this._clicked.notify(e)
    }
}

const button = new Button()
button.clicked.subscribe(this, (e) => { /* handle */ })
```

### Filter and map

`Observable<T>` exposes chainable `filter` and `map`:

```typescript
const big = source.filter(v => v > 10)
const labels = source.map(v => `value=${v}`)
const labelsBig = source.filter(v => v > 10).map(v => `big:${v}`)
```

### Merge

```typescript
import { merge } from '@nbottarini/observable'

const buttonClicked = observable<ClickEvent>()
const textChanged = observable<TextChangedEvent>()
const allEvents = merge(buttonClicked, textChanged)

allEvents.subscribe(this, (event) => { /* fired by either source */ })
```

## Observable values

A reactive value with a current state and notifications on change.

```typescript
import { observableValue } from '@nbottarini/observable'

const name$ = observableValue('John')
name$.value // 'John'

name$.subscribe(this, (newName) => { /* called whenever value changes */ })
name$.value = 'new name' // notifies subscribers
```

`observableValue<T>(initial)` returns a `MutableObservableValue<T>`. Expose it as `ObservableValue<T>` to make it read-only from the outside.

### Computed values

```typescript
import { observableComputed, observableValue } from '@nbottarini/observable'

const a$ = observableValue(1)
const b$ = observableValue(2)
const sum$ = observableComputed((a, b) => a + b, a$, b$)

sum$.value // 3
sum$.subscribe(this, (s) => { /* notified when a$ or b$ changes */ })
a$.value = 5 // sum$ recomputes and notifies
```

### Map

```typescript
const value$ = observableValue(1)
const tenfold$ = value$.map(v => v * 10)
```

## Observable resources

An asynchronous value with a lifecycle. Useful for anything that requires a fetch step before being available — remote data, IndexedDB, heavy local computation, anything async.

Each piece of state is exposed twice: a `$`-suffixed reactive view (`ObservableValue`) for subscribing or chaining, and a plain synchronous getter for reading the current value. They are always in sync — `resource.data === resource.data$.value`.

```typescript
import { observableResource } from '@nbottarini/observable'

const profile = observableResource(async () => {
    const res = await fetch('/api/me')
    return res.json()
})

await profile.whenReady()      // triggers the fetch on first call

// Sync reads
profile.data                   // current value
profile.status                 // 'uninitialized' | 'loading' | 'ready' | 'error'
profile.error                  // last fetch error, if any
profile.isRefreshing           // true while a background refresh is in flight

// Reactive views (subscribe / chain)
profile.data$.subscribe(this, (value) => { /* react to data changes */ })
profile.status$.subscribe(this, (status) => { /* react to status changes */ })

await profile.refresh()        // forces a new fetch
profile.reset()                // back to uninitialized, drops cached value
```

### Stale-while-revalidate

Once data has been loaded, subsequent refreshes follow the stale-while-revalidate pattern: `data` keeps the previous value, `status` stays `ready`, and `isRefreshing` flips to `true` while the new fetch is in flight. The UI keeps showing the cached value instead of flickering, and can render a small refresh indicator off `isRefreshing`.

If a background refresh fails, `error` is populated but `status` remains `ready` and the cached data stays available.

```typescript
// First load: status goes uninitialized → loading → ready
await profile.whenReady()

// Refresh: status stays ready; isRefreshing flips true → false
profile.isRefreshing$.subscribe(this, (refreshing) => {
    showSpinner(refreshing)  // small indicator, data stays visible
})
await profile.refresh()
```

### Options

```typescript
observableResource(fetchFn, {
    ttlSecs: 60,   // staleness threshold (default 60)
    eager: true,   // fetch on construction; default is lazy
})
```

### Deriving resources

Use `.map()` to derive a new `ObservableResource` from an existing one. The derived resource keeps the source's `status`, `error`, `isRefreshing`, `whenReady()` and `refresh()`, and exposes a transformed view of `data`. `reset()` is a no-op on a derived resource — reset the source explicitly.

```typescript
const profile = observableResource(async () => fetchProfile())
const userName = profile.map(p => p?.name)        // ObservableResource<string>
const isAdult = profile.map(p => p ? p.age >= 18 : undefined)

await profile.whenReady()
userName.data  // 'Jorge'
```

### Composing data with observable values

If you only need a derived value (without the resource lifecycle), use `data$.map()` to get a plain `ObservableValue`:

```typescript
const isLoading$ = profile.status$.map(s => s === 'loading')
const userName$ = profile.data$.map(p => p?.name ?? '')
```
