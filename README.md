[![npm](https://img.shields.io/npm/v/@nbottarini/observable.svg)](https://www.npmjs.com/package/@nbottarini/observable)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI Status](https://github.com/nbottarini/observable-js/actions/workflows/main.yml/badge.svg?branch=main)](https://github.com/nbottarini/observable-js/actions)

# Observable-Js
Tiny Observable pattern implementation for creating observable properties
## Installation

Npm:
```
$ npm install --save @nbottarini/observable
```

Yarn:
```
$ yarn add @nbottarini/observable
```

## Usage

### Observables

**View1.ts:**
```typescript
export class View1 {
    public readonly buttonClicked = observable<ClickEvent>()
    public readonly textChanged = observable<TextChangedEvent>()
    
    // Do something internally to handle UI events 
    
    private handleButtonClick(e: ClickEvent) {
        this.buttonClicked.notify(e)
    }
}
```

**View2.ts:**
```typescript
export class View2 {
    private sampleView: View1
    
    constructor() {
        this.sampleView = new View1()
        this.sampleView.buttonClicked.subscribe(this, this.onSampleViewButtonClicked)
    }

    onSampleViewButtonClicked(e: ClickEvent) {
        
    }
}
```

### Composite observables

```typescript
const buttonClicked = observable<ClickEvent>()
const textChanged = observable<TextChangedEvent>()
const allEvents = compositeObservable(buttonClicked, textChanged)

allEvents.subscribe({}, (event) => {
    // Notifies click and text changed events
})
```

### Observable values:

```typescript
const nameProperty$ = observableValue('John')
nameProperty$.value // 'John' 

nameProperty$.changed.subscribe(this, this.onNameChanged)
nameProperty$.value = 'new name' // Notifies changes to subscribers
```

### Observable computed values:
```typescript
const property1 = observableValue(1)
const property2$ = observableValue(2)
const computedProperty$ = observableComputed((value1, value2) => value1 + value2, $property1, $property2)
computedProperty$.value // returns 3 

computedProperty$.changed.subscribe(this, this.onComputedChanged)
property1$.value = 3 // Notifies new computed value 5 to computedProperty$ subscribers

```
