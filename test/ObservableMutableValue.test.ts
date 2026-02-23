import { ObservableMutableValue } from '../src/ObservableMutableValue'

it('initial value', () => {
    const property = new ObservableMutableValue('initial')

    expect(property.value).toEqual('initial')
})

it('set value', () => {
    const property = new ObservableMutableValue('initial')

    property.value = 'new value'

    expect(property.value).toEqual('new value')
})

it('notify observers on value change', () => {
    const property = new ObservableMutableValue('initial')
    let observerNotifiedValue = ''
    property.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property.value = 'new value'

    expect(observerNotifiedValue).toEqual('new value')
})

it('don\'t notify observers when new value is equal to previous value', () => {
    const property = new ObservableMutableValue('initial')
    property.value = 'new value'
    let observerNotifiedValue = ''
    property.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property.value = 'new value'

    expect(observerNotifiedValue).toEqual('')
})


it('map returns a new observable computed value with mapped function as compute function', () => {
    const value$ = new ObservableMutableValue(1)
    const mapped$ = value$.map(it => it * 10)

    value$.value = 5

    expect(mapped$.value).toEqual(50)
})
