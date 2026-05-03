import { DefaultObservable } from '../../src'

it('notifies subscribed observer', async () => {
    const received: ClickEvent[] = []
    const observer = { onClick: (event: ClickEvent) => received.push(event) }
    observable.subscribe(observer, observer.onClick)

    await observable.notify({ elementId: 2 })

    expect(received).toEqual([{ elementId: 2 }])
})

it('notifies multiple subscribed observers', async () => {
    const received: string[] = []
    const observer1 = { onClick: (e: ClickEvent) => received.push(`o1:${e.elementId}`) }
    const observer2 = { onClick: (e: ClickEvent) => received.push(`o2:${e.elementId}`) }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)

    await observable.notify({ elementId: 2 })

    expect(received).toEqual(['o1:2', 'o2:2'])
})

it('does not notify unsubscribed observer', async () => {
    const received: string[] = []
    const observer1 = { onClick: (e: ClickEvent) => received.push(`o1:${e.elementId}`) }
    const observer2 = { onClick: (e: ClickEvent) => received.push(`o2:${e.elementId}`) }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)
    observable.unsubscribe(observer1)

    await observable.notify({ elementId: 2 })

    expect(received).toEqual(['o2:2'])
})

it('unsubscribeAll removes all observers', async () => {
    const received: ClickEvent[] = []
    const observer1 = { onClick: (e: ClickEvent) => received.push(e) }
    const observer2 = { onClick: (e: ClickEvent) => received.push(e) }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)
    observable.unsubscribeAll()

    await observable.notify({ elementId: 2 })

    expect(received).toEqual([])
})

it('awaits async observers', async () => {
    const received: string[] = []
    const observer1 = {
        onClick: (e: ClickEvent) => new Promise<void>((resolve) => setTimeout(() => {
            received.push(`o1:${e.elementId}`)
            resolve()
        }, 1)),
    }
    const observer2 = {
        onClick: (e: ClickEvent) => new Promise<void>((resolve) => setTimeout(() => {
            received.push(`o2:${e.elementId}`)
            resolve()
        }, 1)),
    }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)

    await observable.notify({ elementId: 2 })

    expect(received).toContainEqual('o1:2')
    expect(received).toContainEqual('o2:2')
})

it('hasObserver returns true after subscribing', () => {
    const observer = { onClick: () => {} }
    observable.subscribe(observer, observer.onClick)

    expect(observable.hasObserver(observer)).toBeTrue()
})

it('hasObserver returns false after unsubscribing', () => {
    const observer = { onClick: () => {} }
    observable.subscribe(observer, observer.onClick)
    observable.unsubscribe(observer)

    expect(observable.hasObserver(observer)).toBeFalse()
})

beforeEach(() => {
    observable = new DefaultObservable<ClickEvent>()
})

let observable: DefaultObservable<ClickEvent>

interface ClickEvent {
    elementId: number
}
