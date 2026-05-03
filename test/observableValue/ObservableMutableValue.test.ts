import { observableValue } from '../../src'

it('exposes the initial value', () => {
    const property$ = observableValue('initial')

    expect(property$.value).toEqual('initial')
})

it('updates the value when set', () => {
    const property$ = observableValue('initial')

    property$.value = 'new value'

    expect(property$.value).toEqual('new value')
})

it('notifies observers when the value changes', () => {
    const property$ = observableValue('initial')
    let notifiedValue = ''
    property$.subscribe({}, (value) => notifiedValue = value)

    property$.value = 'new value'

    expect(notifiedValue).toEqual('new value')
})

it('does not notify when the new value equals the previous value', () => {
    const property$ = observableValue('initial')
    property$.value = 'new value'
    let notifiedValue = ''
    property$.subscribe({}, (value) => notifiedValue = value)

    property$.value = 'new value'

    expect(notifiedValue).toEqual('')
})

it('does not notify unsubscribed observer', () => {
    const property$ = observableValue('initial')
    const observer = {}
    let notifiedValue = ''
    property$.subscribe(observer, (value) => notifiedValue = value)
    property$.unsubscribe(observer)

    property$.value = 'new value'

    expect(notifiedValue).toEqual('')
})

it('unsubscribeAll removes all observers', () => {
    const property$ = observableValue('initial')
    let notifiedValue = ''
    property$.subscribe({}, (value) => notifiedValue = value)
    property$.unsubscribeAll()

    property$.value = 'new value'

    expect(notifiedValue).toEqual('')
})

it('hasObserver returns true after subscribing', () => {
    const property$ = observableValue('initial')
    const observer = {}
    property$.subscribe(observer, () => {})

    expect(property$.hasObserver(observer)).toBeTrue()
})

it('map returns a new observable value computed from a mapper', () => {
    const value$ = observableValue(1)
    const mapped$ = value$.map(it => it * 10)

    value$.value = 5

    expect(mapped$.value).toEqual(50)
})
