import { observable } from '../../src'

it('passes events through when no predicate or mapper is given', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const derived = source.map(it => it)
    derived.subscribe(observer, observer.onEvent)

    await source.notify(5)

    expect(received).toEqual([5])
})

it('filter only forwards events that match the predicate', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const derived = source.filter(v => v > 10)
    derived.subscribe(observer, observer.onEvent)

    await source.notify(5)
    await source.notify(10)
    await source.notify(15)

    expect(received).toEqual([15])
})

it('map transforms events from source', async () => {
    const received: string[] = []
    const observer = { onEvent: (e: string) => received.push(e) }
    const source = observable<number>()
    const derived = source.map(v => `n=${v}`)
    derived.subscribe(observer, observer.onEvent)

    await source.notify(10)
    await source.notify(15)

    expect(received).toEqual(['n=10', 'n=15'])
})

it('filter and map can be chained', async () => {
    const received: string[] = []
    const observer = { onEvent: (e: string) => received.push(e) }
    const source = observable<number>()
    const derived = source.filter(v => v > 10).map(v => (v + 1).toString())
    derived.subscribe(observer, observer.onEvent)

    await source.notify(10)
    await source.notify(15)

    expect(received).toEqual(['16'])
})

it('does not notify unsubscribed observer', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const derived = source.map(it => it)
    derived.subscribe(observer, observer.onEvent)
    derived.unsubscribe(observer)

    await source.notify(2)

    expect(received).toEqual([])
})

it('unsubscribeAll removes all observers', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const derived = source.map(it => it)
    derived.subscribe(observer, observer.onEvent)
    derived.unsubscribeAll()

    await source.notify(2)

    expect(received).toEqual([])
})

it('attaches to source lazily on first subscriber', () => {
    const source = observable<number>()
    const derived = source.map(it => it)

    const observer = { onEvent: () => {} }
    derived.subscribe(observer, observer.onEvent)

    expect(source.hasObserver(derived)).toBeTrue()
})

it('detaches from source when last observer unsubscribes', () => {
    const source = observable<number>()
    const derived = source.map(it => it)
    const observer = { onEvent: () => {} }
    derived.subscribe(observer, observer.onEvent)

    derived.unsubscribe(observer)

    expect(source.hasObserver(derived)).toBeFalse()
})
