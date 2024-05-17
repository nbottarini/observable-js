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

**View1.ts:**
```typescript
export class View1 {
    public readonly buttonClicked = new Observable<ClickEvent>()
    public readonly textChanged = new Observable<TextChangedEvent>()
    
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

**Observable properties:**

```typescript
const nameProperty = new ObservableProperty('John')
nameProperty.changed.subscribe(this, this.onNameChanged)

nameProperty.value = 'new name'
```
