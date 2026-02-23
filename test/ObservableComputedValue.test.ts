import { ObservableMutableValue, observableValue } from '../src/ObservableMutableValue'
import { ObservableComputedValue } from '../src/ObservableComputedValue'

it('initial value is computed value', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    const computed = new ObservableComputedValue((property1, property2) => {
        return property1 + property2
    }, property1$, property2$)

    expect(computed.value).toEqual(3)
})

it('when dependent property changes value reflects new computed value', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    const computed = new ObservableComputedValue((property1, property2) => {
        return property1 + property2
    }, property1$, property2$)

    property2$.value = 5

    expect(computed.value).toEqual(6)
})

it('notify observers when dependent value changes', () => {
    const property$ = observableValue('initial')
    let observerNotifiedValue = ''
    const computed = new ObservableComputedValue((prop) => prop, property$)
    computed.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property$.value = 'new value'

    expect(observerNotifiedValue).toEqual('new value')
})

it('when not observed, value recomputes on every read', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed = new ObservableComputedValue((a, b) => {
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
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed = new ObservableComputedValue((a, b) => {
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
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed = new ObservableComputedValue((a, b) => {
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
    const property$ = observableValue('initial')
    const received: string[] = []
    const computed = new ObservableComputedValue((v) => v, property$)
    const o1 = {}
    const o2 = {}
    computed.changed.subscribe(o1, (v) => received.push(`o1:${v}`))
    computed.changed.subscribe(o2, (v) => received.push(`o2:${v}`))

    property$.value = 'new'

    expect(received).toEqual(['o1:new', 'o2:new'])
})

it('unsubscribe stops notifications for that observer only', () => {
    const property$ = observableValue('initial')
    const received: string[] = []
    const computed = new ObservableComputedValue((v) => v, property$)
    const o1 = {}
    const o2 = {}
    computed.changed.subscribe(o1, (v) => received.push(`o1:${v}`))
    computed.changed.subscribe(o2, (v) => received.push(`o2:${v}`))
    computed.changed.unsubscribe(o1)

    property$.value = 'new'

    expect(received).toEqual(['o2:new'])
})

it('unsubscribeAll stops all notifications', () => {
    const property$ = observableValue('initial')
    const computed = new ObservableComputedValue((v) => v, property$)
    let notified = ''
    computed.changed.subscribe({}, (v) => { notified = v })
    computed.changed.unsubscribeAll()

    property$.value = 'new'

    expect(notified).toEqual('')
})

it('map returns a new observable computed value with mapped function as compute function', () => {
    const value$ = new ObservableMutableValue(1)
    const mapped1$ = value$.map(it => it * 10)
    const mapped2$ = mapped1$.map(it => it + 5)

    value$.value = 5

    expect(mapped2$.value).toEqual(55)
})
