import { ObservableProperty } from '../src/ObservableProperty'

it('initial value', () => {
    const property = new ObservableProperty('initial')

    expect(property.value).toEqual('initial')
})

it('set value', () => {
    const property = new ObservableProperty('initial')

    property.value = 'new value'

    expect(property.value).toEqual('new value')
})

it('notify observers on value change', () => {
    const property = new ObservableProperty('initial')
    let observerNotifiedValue = ''
    property.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property.value = 'new value'

    expect(observerNotifiedValue).toEqual('new value')
})

it('don\'t notify observers when new value is equal to previous value', () => {
    const property = new ObservableProperty('initial')
    property.value = 'new value'
    let observerNotifiedValue = ''
    property.changed.subscribe({}, (value) => observerNotifiedValue = value)

    property.value = 'new value'

    expect(observerNotifiedValue).toEqual('')
})
