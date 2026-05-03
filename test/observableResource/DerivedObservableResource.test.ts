import { observableResource } from '../../src'

it('exposes the mapped data when the source resolves', async () => {
    const source = observableResource(async () => ({ name: 'Jorge' }))
    const derived = source.map(p => p?.name)

    await source.whenReady()

    expect(derived.data).toEqual('Jorge')
})

it('reflects undefined data while the source is not ready', () => {
    const source = observableResource(async () => ({ name: 'Jorge' }))
    const derived = source.map(p => p?.name)

    expect(derived.data).toBeUndefined()
})

it('shares the source status', async () => {
    const source = observableResource(async () => 'hello')
    const derived = source.map(v => v?.toUpperCase())

    await derived.whenReady()

    expect(derived.status).toEqual('ready')
    expect(derived.status$).toBe(source.status$)
})

it('shares the source error', async () => {
    const error = new Error('boom')
    const source = observableResource<string>(async () => { throw error })
    const derived = source.map(v => v?.toUpperCase())

    await expect(source.whenReady()).rejects.toThrow('boom')

    expect(derived.error).toBe(error)
})

it('shares the source isRefreshing flag', async () => {
    let resolve: (v: string) => void = () => {}
    const source = observableResource(() => new Promise<string>(r => { resolve = r }))
    const firstLoad = source.whenReady()
    resolve('first')
    await firstLoad
    const derived = source.map(v => v?.toUpperCase())
    const refreshings: boolean[] = []
    derived.isRefreshing$.subscribe({}, (r) => refreshings.push(r))

    const refreshPromise = source.refresh()
    resolve('second')
    await refreshPromise

    expect(refreshings).toEqual([true, false])
})

it('whenReady awaits the source and returns the mapped value', async () => {
    const source = observableResource(async () => ({ name: 'Jorge' }))
    const derived = source.map(p => p?.name)

    const value = await derived.whenReady()

    expect(value).toEqual('Jorge')
})

it('refresh delegates to the source', async () => {
    let fetchCalls = 0
    const source = observableResource(async () => {
        fetchCalls++
        return `v${fetchCalls}`
    })
    const derived = source.map(v => v?.toUpperCase())
    await derived.whenReady()

    await derived.refresh()

    expect(fetchCalls).toEqual(2)
    expect(derived.data).toEqual('V2')
})

it('reset is a no-op on a derived resource', async () => {
    const source = observableResource(async () => 'hello')
    const derived = source.map(v => v?.toUpperCase())
    await derived.whenReady()

    derived.reset()

    expect(source.status).toEqual('ready')
    expect(derived.data).toEqual('HELLO')
})

it('notifies data observers when the source updates', async () => {
    const source = observableResource(async () => 'hello')
    const derived = source.map(v => v?.toUpperCase())
    const received: (string | undefined)[] = []
    derived.data$.subscribe({}, (v) => received.push(v))

    await derived.whenReady()

    expect(received).toEqual(['HELLO'])
})

it('chains map across multiple levels', async () => {
    const source = observableResource(async () => 'hello')
    const upper = source.map(v => v?.toUpperCase())
    const exclaimed = upper.map(v => v ? `${v}!` : undefined)

    await exclaimed.whenReady()

    expect(exclaimed.data).toEqual('HELLO!')
})

it('multiple derived resources can share the same source', async () => {
    const source = observableResource(async () => ({ name: 'Jorge', age: 30 }))
    const name$ = source.map(p => p?.name)
    const age$ = source.map(p => p?.age)

    await source.whenReady()

    expect(name$.data).toEqual('Jorge')
    expect(age$.data).toEqual(30)
})
