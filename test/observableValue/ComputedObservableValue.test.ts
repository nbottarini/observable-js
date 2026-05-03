import { observableComputed, observableValue } from '../../src'

it('initial value is the computed value', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    const computed$ = observableComputed((p1, p2) => p1 + p2, property1$, property2$)

    expect(computed$.value).toEqual(3)
})

it('reflects new computed value when a dependency changes', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    const computed$ = observableComputed((p1, p2) => p1 + p2, property1$, property2$)

    property2$.value = 5

    expect(computed$.value).toEqual(6)
})

it('notifies observers when a dependency changes', () => {
    const property$ = observableValue('initial')
    let notifiedValue = ''
    const computed$ = observableComputed((v) => v, property$)
    computed$.subscribe({}, (value) => notifiedValue = value)

    property$.value = 'new value'

    expect(notifiedValue).toEqual('new value')
})

it('recomputes on every read when there are no observers', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed$ = observableComputed((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)

    void computed$.value
    void computed$.value

    expect(computeCalls).toEqual(2)
})

it('caches the value while there are observers', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed$ = observableComputed((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)
    computed$.subscribe({}, () => {})
    void computed$.value

    void computed$.value

    expect(computeCalls).toEqual(1)
})

it('recomputes when a dependency changes', () => {
    const property1$ = observableValue(1)
    const property2$ = observableValue(2)
    let computeCalls = 0
    const computed$ = observableComputed((a, b) => {
        computeCalls++
        return a + b
    }, property1$, property2$)
    void computed$.value

    property2$.value = 5

    expect(computed$.value).toEqual(6)
    expect(computeCalls).toEqual(2)
})

it('notifies multiple observers', () => {
    const property$ = observableValue('initial')
    const received: string[] = []
    const computed$ = observableComputed((v) => v, property$)
    computed$.subscribe({}, (v) => received.push(`o1:${v}`))
    computed$.subscribe({}, (v) => received.push(`o2:${v}`))

    property$.value = 'new'

    expect(received).toEqual(['o1:new', 'o2:new'])
})

it('unsubscribe stops notifications for that observer only', () => {
    const property$ = observableValue('initial')
    const received: string[] = []
    const computed$ = observableComputed((v) => v, property$)
    const observer1 = {}
    const observer2 = {}
    computed$.subscribe(observer1, (v) => received.push(`o1:${v}`))
    computed$.subscribe(observer2, (v) => received.push(`o2:${v}`))
    computed$.unsubscribe(observer1)

    property$.value = 'new'

    expect(received).toEqual(['o2:new'])
})

it('invalidates cached value when the last observer unsubscribes', () => {
    const property$ = observableValue<number | undefined>(undefined)
    const computed$ = observableComputed((v) => v, property$)
    const observer = {}
    computed$.subscribe(observer, () => {})
    expect(computed$.value).toBeUndefined()

    computed$.unsubscribe(observer)
    property$.value = 3
    computed$.subscribe(observer, () => {})

    expect(computed$.value).toEqual(3)
})

it('unsubscribeAll stops all notifications', () => {
    const property$ = observableValue('initial')
    const computed$ = observableComputed((v) => v, property$)
    let notified = ''
    computed$.subscribe({}, (v) => { notified = v })
    computed$.unsubscribeAll()

    property$.value = 'new'

    expect(notified).toEqual('')
})

it('detaches from deps when there are no observers', () => {
    const property$ = observableValue('initial')
    const computed$ = observableComputed((v) => v, property$)
    const observer = {}
    computed$.subscribe(observer, () => {})

    computed$.unsubscribe(observer)

    expect(property$.hasObserver(computed$)).toBeFalse()
})

it('chains map across multiple levels', () => {
    const value$ = observableValue(1)
    const mapped1$ = value$.map(it => it * 10)
    const mapped2$ = mapped1$.map(it => it + 5)

    value$.value = 5

    expect(mapped2$.value).toEqual(55)
})
