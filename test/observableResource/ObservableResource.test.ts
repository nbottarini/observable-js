import { observableResource } from '../../src'

it('starts in uninitialized state with undefined data', () => {
    const resource = observableResource(async () => 'hello')

    expect(resource.status.value).toEqual('uninitialized')
    expect(resource.data.value).toBeUndefined()
    expect(resource.error.value).toBeNull()
    expect(resource.isRefreshing.value).toBeFalse()
})

it('whenReady triggers the fetch and resolves with the value', async () => {
    const resource = observableResource(async () => 'hello')

    const value = await resource.whenReady()

    expect(value).toEqual('hello')
    expect(resource.data.value).toEqual('hello')
    expect(resource.status.value).toEqual('ready')
})

it('transitions to loading while the first fetch is in flight', async () => {
    const statuses: string[] = []
    let resolve: (v: string) => void = () => {}
    const fetch = () => new Promise<string>(r => { resolve = r })
    const resource = observableResource(fetch)
    resource.status.subscribe({}, (s) => statuses.push(s))

    const promise = resource.whenReady()
    resolve('hello')
    await promise

    expect(statuses).toEqual(['loading', 'ready'])
})

it('transitions to error when the first fetch fails', async () => {
    const error = new Error('boom')
    const resource = observableResource<string>(async () => { throw error })

    await expect(resource.whenReady()).rejects.toThrow('boom')
    expect(resource.status.value).toEqual('error')
    expect(resource.error.value).toBe(error)
})

it('does not refetch when data is fresh', async () => {
    let fetchCalls = 0
    const resource = observableResource(async () => {
        fetchCalls++
        return 'hello'
    })

    await resource.whenReady()
    await resource.whenReady()

    expect(fetchCalls).toEqual(1)
})

it('refresh forces a new fetch and updates data', async () => {
    let fetchCalls = 0
    const resource = observableResource(async () => {
        fetchCalls++
        return `value-${fetchCalls}`
    })

    await resource.whenReady()
    await resource.refresh()

    expect(fetchCalls).toEqual(2)
    expect(resource.data.value).toEqual('value-2')
})

it('keeps status ready and flips isRefreshing while refreshing existing data', async () => {
    let resolve: (v: string) => void = () => {}
    const resource = observableResource(() => new Promise<string>(r => { resolve = r }))
    const firstLoad = resource.whenReady()
    resolve('first')
    await firstLoad
    const statuses: string[] = []
    const refreshings: boolean[] = []
    resource.status.subscribe({}, (s) => statuses.push(s))
    resource.isRefreshing.subscribe({}, (r) => refreshings.push(r))

    const refreshPromise = resource.refresh()
    resolve('second')
    await refreshPromise

    expect(statuses).toEqual([])
    expect(refreshings).toEqual([true, false])
    expect(resource.status.value).toEqual('ready')
    expect(resource.data.value).toEqual('second')
})

it('keeps cached data and stays ready when a refresh fails', async () => {
    let shouldFail = false
    const resource = observableResource<string>(async () => {
        if (shouldFail) throw new Error('boom')
        return 'cached'
    })
    await resource.whenReady()
    shouldFail = true

    await expect(resource.refresh()).rejects.toThrow('boom')

    expect(resource.status.value).toEqual('ready')
    expect(resource.data.value).toEqual('cached')
    expect(resource.error.value?.message).toEqual('boom')
    expect(resource.isRefreshing.value).toBeFalse()
})

it('clears error after a successful refresh', async () => {
    let shouldFail = true
    const resource = observableResource<string>(async () => {
        if (shouldFail) throw new Error('boom')
        return 'value'
    })
    await expect(resource.whenReady()).rejects.toThrow('boom')
    shouldFail = false

    await resource.refresh()

    expect(resource.error.value).toBeNull()
    expect(resource.status.value).toEqual('ready')
})

it('whenReady returns stale data immediately and refreshes in background', async () => {
    let fetchCalls = 0
    const resource = observableResource(async () => {
        fetchCalls++
        return `value-${fetchCalls}`
    }, { ttlSecs: 0 })
    await resource.whenReady()
    const statuses: string[] = []
    resource.status.subscribe({}, (s) => statuses.push(s))

    const value = await resource.whenReady()

    expect(value).toEqual('value-1')
    expect(statuses).toEqual([])
    expect(fetchCalls).toEqual(2)
})

it('reset returns the resource to uninitialized state', async () => {
    const resource = observableResource(async () => 'hello')
    await resource.whenReady()

    resource.reset()

    expect(resource.status.value).toEqual('uninitialized')
    expect(resource.data.value).toBeUndefined()
    expect(resource.error.value).toBeNull()
    expect(resource.isRefreshing.value).toBeFalse()
})

it('ignores in-flight result if reset was called', async () => {
    let resolve: (v: string) => void = () => {}
    const resource = observableResource(() => new Promise<string>(r => { resolve = r }))
    const promise = resource.whenReady()

    resource.reset()
    resolve('late value')
    await promise

    expect(resource.data.value).toBeUndefined()
    expect(resource.status.value).toEqual('uninitialized')
    expect(resource.isRefreshing.value).toBeFalse()
})

it('notifies data observers when the value loads', async () => {
    const received: (string | undefined)[] = []
    const resource = observableResource(async () => 'hello')
    resource.data.subscribe({}, (v) => received.push(v))

    await resource.whenReady()

    expect(received).toEqual(['hello'])
})

it('eager option triggers the fetch on construction', async () => {
    let fetchCalls = 0
    const resource = observableResource(async () => {
        fetchCalls++
        return 'hello'
    }, { eager: true })

    await resource.whenReady()

    expect(fetchCalls).toEqual(1)
    expect(resource.status.value).toEqual('ready')
})

it('concurrent whenReady calls share the same fetch', async () => {
    let fetchCalls = 0
    const resource = observableResource(async () => {
        fetchCalls++
        return 'hello'
    })

    await Promise.all([resource.whenReady(), resource.whenReady(), resource.whenReady()])

    expect(fetchCalls).toEqual(1)
})
