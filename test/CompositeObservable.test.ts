import { observable } from '../src'
import { CompositeObservable } from '../src/CompositeObservable'

it('receives events from source observable', () => {
    let receivedEvents = []
    const observer = {
        onNewEvent: (event: number) => receivedEvents.push(event)
    }
    const observable1 = observable<number>()
    const composite = new CompositeObservable([observable1])
    composite.subscribe(observer, observer.onNewEvent)

    observable1.notify(5)

    expect(receivedEvents).toEqual([5])
})

it('receives events from multiple sources', () => {
    let receivedEvents = []
    const observer = {
        onNewEvent: (event: number) => receivedEvents.push(event)
    }
    const observable1 = observable<number>()
    const observable2 = observable<string>()
    const composite = new CompositeObservable([observable1, observable2])
    composite.subscribe(observer, observer.onNewEvent)

    observable1.notify(2)
    observable2.notify('test')

    expect(receivedEvents).toEqual([2, 'test'])
})

it('doesn\'t notify to unsubscribed observer', () => {
    let receivedEvents = []
    const observer = {
        onNewNumber: (event: number) => receivedEvents.push(event)
    }
    const observable1 = observable<number>()
    const composite = new CompositeObservable([observable1])
    composite.subscribe(observer, observer.onNewNumber)
    composite.unsubscribe(observer)

    observable1.notify(2)

    expect(receivedEvents).toEqual([])
})

it('unsubscribeAll unsubscribes all observers', () => {
    let receivedEvents = []
    const observer = {
        onNewNumber: (event: number) => receivedEvents.push(event)
    }
    const observable1 = observable<number>()
    const composite = new CompositeObservable([observable1])
    composite.subscribe(observer, observer.onNewNumber)
    composite.unsubscribeAll()

    observable1.notify(2)

    expect(receivedEvents).toEqual([])
})
