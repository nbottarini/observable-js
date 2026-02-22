import { observable } from '../src'
import { DerivedObservable } from '../src/DerivedObservable'

it('receives events from source observable', () => {
    let receivedEvents = []
    const observer = {
        onNewEvent: (event: number) => receivedEvents.push(event)
    }
    const source = observable<number>()
    const derived = new DerivedObservable(source)
    derived.subscribe(observer, observer.onNewEvent)

    source.notify(5)

    expect(receivedEvents).toEqual([5])
})

it('can filter events from source observable', () => {
    let receivedEvents = []
    const observer = {
        onNewEvent: (event: number) => receivedEvents.push(event)
    }
    const parent = observable<number>()
    const derived = new DerivedObservable(parent, (v) => v > 10)
    derived.subscribe(observer, observer.onNewEvent)

    parent.notify(5)
    parent.notify(10)
    parent.notify(15)

    expect(receivedEvents).toEqual([15])
})

it('can map events from source observable', () => {
    let receivedEvents = []
    const observer = {
        onNewEvent: (event: string) => receivedEvents.push(event)
    }
    const parent = observable<number>()
    const derived = new DerivedObservable(parent, v => v > 10, v => (v + 1).toString())
    derived.subscribe(observer, observer.onNewEvent)

    parent.notify(10)
    parent.notify(15)

    expect(receivedEvents).toEqual(['16'])
})

it('doesn\'t notify to unsubscribed observer', () => {
    let receivedEvents = []
    const observer = {
        onNewNumber: (event: number) => receivedEvents.push(event)
    }
    const source = observable<number>()
    const derived = new DerivedObservable(source)
    derived.subscribe(observer, observer.onNewNumber)
    derived.unsubscribe(observer)

    source.notify(2)

    expect(receivedEvents).toEqual([])
})

it('unsubscribeAll unsubscribes all observers', () => {
    let receivedEvents = []
    const observer = {
        onNewNumber: (event: number) => receivedEvents.push(event)
    }
    const source = observable<number>()
    const derived = new DerivedObservable(source)
    derived.subscribe(observer, observer.onNewNumber)
    derived.unsubscribeAll()

    source.notify(2)

    expect(receivedEvents).toEqual([])
})
