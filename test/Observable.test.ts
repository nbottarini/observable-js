import { Observable } from '../src'

it('notifies to subscribed observer', () => {
    let receivedEvents = []
    const observer = {
        onClick: (event: ClickEvent) => receivedEvents.push(event)
    }
    observable.subscribe(observer, observer.onClick)

    observable.notify({ elementId: 2 })

    expect(receivedEvents).toEqual([{ elementId: 2 }])
})

it('notifies to multiple subscribed observers', () => {
    let receivedEvents = []
    const observer1 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer1' })
    }
    const observer2 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer2' })
    }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)

    observable.notify({ elementId: 2 })

    expect(receivedEvents).toEqual([{ elementId: 2, observer: 'observer1' }, { elementId: 2, observer: 'observer2' }])
})

it('doesn\'t notify to unsubscribed observer', () => {
    let receivedEvents = []
    const observer1 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer1' })
    }
    const observer2 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer2' })
    }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)
    observable.unsubscribe(observer1)

    observable.notify({ elementId: 2 })

    expect(receivedEvents).toEqual([{ elementId: 2, observer: 'observer2' }])
})

it('unsubscribeAll unsubscribes all observers', () => {
    let receivedEvents = []
    const observer1 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer1' })
    }
    const observer2 = {
        onClick: (event: ClickEvent) => receivedEvents.push({ ...event, observer: 'observer2' })
    }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)
    observable.unsubscribeAll()

    observable.notify({ elementId: 2 })

    expect(receivedEvents).toEqual([])
})

it('notifies to multiple async observers', async () => {
    let receivedEvents = []
    const observer1 = {
        onClick: (event: ClickEvent) =>  {
            return new Promise((resolve) => {
                setTimeout(() => {
                    receivedEvents.push({ ...event, observer: 'observer1' })
                    resolve(null)
                }, 1)
            })
        }
    }
    const observer2 = {
        onClick: (event: ClickEvent) =>  {
            return new Promise((resolve) => {
                setTimeout(() => {
                    receivedEvents.push({ ...event, observer: 'observer2' })
                    resolve(null)
                }, 1)
            })
        }
    }
    observable.subscribe(observer1, observer1.onClick)
    observable.subscribe(observer2, observer2.onClick)

    await observable.notify({ elementId: 2 })

    expect(receivedEvents).toContainEqual({ elementId: 2, observer: 'observer1' })
    expect(receivedEvents).toContainEqual({ elementId: 2, observer: 'observer2' })
})

it('hasObserver', () => {
    const observer = {
        onClick: () => {}
    }
    observable.subscribe(observer, observer.onClick)

    expect(observable.hasObserver(observer)).toBeTrue()
})

beforeEach(() => {
    observable = new Observable<ClickEvent>()
})

let observable: Observable<ClickEvent>

interface ClickEvent {
    elementId: number
}
