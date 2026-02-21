import { property } from '../src/MutableProperty'
import { ComputedProperty } from '../src/ComputedProperty'

it('initial value is computed value', () => {
    const property1$ = property(1)
    const property2$ = property(2)
    const computed = new ComputedProperty((property1, property2) => {
        return property1 + property2
    }, property1$, property2$)

    expect(computed.value).toEqual(3)
})

it('when dependent property changes value reflects new computed value', () => {
    const property1$ = property(1)
    const property2$ = property(2)
    const computed = new ComputedProperty((property1, property2) => {
        return property1 + property2
    }, property1$, property2$)

    property2$.value = 5

    expect(computed.value).toEqual(6)
})

it('notify observers when dependent value changes', () => {
    const property$ = property('initial')
    let observerNotifiedValue = ''
    const computed = new ComputedProperty((prop) => prop, property$)
    computed.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property$.value = 'new value'

    expect(observerNotifiedValue).toEqual('new value')
})

it('when not observed, value recomputes on every read', () => {
    const property1$ = property(1)
    const property2$ = property(2)
    let computeCalls = 0
    const computed = new ComputedProperty((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)
    // @ts-ignore
    const firstAccess = computed.value

    // @ts-ignore
    const secondAccess = computed.value

    expect(computeCalls).toEqual(2)
})

it('when observed, value is cached and updated', () => {
    const property1$ = property(1)
    const property2$ = property(2)
    let computeCalls = 0
    const computed = new ComputedProperty((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)
    computed.changed.subscribe({}, (value) => {})
    // @ts-ignore
    const firstAccess = computed.value

    // @ts-ignore
    const secondAccess = computed.value

    expect(computeCalls).toEqual(1)
})

it('recomputes value when dependencies change', async () => {
    const property1$ = property(1)
    const property2$ = property(2)
    let computeCalls = 0
    const computed = new ComputedProperty((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)
    // @ts-ignore
    const firstAccess = computed.value

    property2$.value = 5

    expect(computed.value).toEqual(6)
    expect(computeCalls).toEqual(2)
})

it('notifies multiple observers', () => {
    const property$ = property('initial')
    const received: string[] = []
    const computed = new ComputedProperty((v) => v, property$)
    const o1 = {}
    const o2 = {}
    computed.changed.subscribe(o1, (v) => received.push(`o1:${v}`))
    computed.changed.subscribe(o2, (v) => received.push(`o2:${v}`))

    property$.value = 'new'

    expect(received).toEqual(['o1:new', 'o2:new'])
})

it('unsubscribe stops notifications for that observer only', () => {
    const property$ = property('initial')
    const received: string[] = []
    const computed = new ComputedProperty((v) => v, property$)
    const o1 = {}
    const o2 = {}
    computed.changed.subscribe(o1, (v) => received.push(`o1:${v}`))
    computed.changed.subscribe(o2, (v) => received.push(`o2:${v}`))
    computed.changed.unsubscribe(o1)

    property$.value = 'new'

    expect(received).toEqual(['o2:new'])
})

it('unsubscribeAll stops all notifications', () => {
    const property$ = property('initial')
    const computed = new ComputedProperty((v) => v, property$)
    let notified = ''
    computed.changed.subscribe({}, (v) => { notified = v })
    computed.changed.unsubscribeAll()

    property$.value = 'new'

    expect(notified).toEqual('')
})
