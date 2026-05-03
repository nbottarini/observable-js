import { merge, observable } from '../../src'

it('receives events from a single source', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const composite = merge(source)
    composite.subscribe(observer, observer.onEvent)

    await source.notify(5)

    expect(received).toEqual([5])
})

it('receives events from multiple sources', async () => {
    const received: (number | string)[] = []
    const observer = { onEvent: (e: number | string) => received.push(e) }
    const numbers = observable<number>()
    const strings = observable<string>()
    const composite = merge(numbers, strings)
    composite.subscribe(observer, observer.onEvent)

    await numbers.notify(2)
    await strings.notify('test')

    expect(received).toEqual([2, 'test'])
})

it('does not notify unsubscribed observer', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const composite = merge(source)
    composite.subscribe(observer, observer.onEvent)
    composite.unsubscribe(observer)

    await source.notify(2)

    expect(received).toEqual([])
})

it('unsubscribeAll removes all observers', async () => {
    const received: number[] = []
    const observer = { onEvent: (e: number) => received.push(e) }
    const source = observable<number>()
    const composite = merge(source)
    composite.subscribe(observer, observer.onEvent)
    composite.unsubscribeAll()

    await source.notify(2)

    expect(received).toEqual([])
})

it('detaches from sources when last observer unsubscribes', () => {
    const source = observable<number>()
    const composite = merge(source)
    const observer = { onEvent: () => {} }
    composite.subscribe(observer, observer.onEvent)

    composite.unsubscribe(observer)

    expect(source.hasObserver(composite)).toBeFalse()
})

it('attaches to sources lazily on first subscriber', () => {
    const source = observable<number>()
    const composite = merge(source)

    const observer = { onEvent: () => {} }
    composite.subscribe(observer, observer.onEvent)

    expect(source.hasObserver(composite)).toBeTrue()
})
