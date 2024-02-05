# SvWeb Components

This was a weekend project to hack up a tiny example web component framework using no build techniques while still attempting to provide the same level of DX offered by "build" frameworks. It's called SvWeb Components because I am bad at naming and the patterns kinda resemble svelte.

### Key Concepts

- **Reactive Signals**: The framework uses reactive signals to manage state. These signals can be used to store values and automatically update the DOM when those values change.
- **Binding to DOM**: It provides mechanisms to bind reactive signals to DOM elements for both displaying data and handling user inputs, enabling real-time updates without manual DOM manipulation.
- **Computed Signals**: In addition to basic reactive signals, the framework supports computed signals, which derive their values from other signals, allowing for dynamic and complex data transformations.

## Getting Started

To use the framework, include your JavaScript logic in a module script tag and reference any necessary external scripts, such as the framework's main functionality (`/main.js`).

### Creating a Signal

Signals are created using the `createSignal` function imported from the framework's core. A signal can hold any value and is used to manage the component's state.

```javascript
import { createSignal } from "/main.js";

const [value, setValue] = createSignal(initialValue);
```

### Binding Signals to the DOM

The framework allows direct binding of signals to DOM elements for both displaying and updating values. This is typically done through a reference system (`ref` attribute) that identifies elements within the component.

#### Displaying a Value

```javascript
value.bindToText(refs.elementRef);
```

#### Handling User Input

```javascript
refs.buttonRef.onclick = () => setValue(newValue);
```

### Working with Computed Signals

Computed signals are defined similarly to basic signals but take a function that determines their value based on other signal values. They are useful for displaying derived or calculated data.

```javascript
const computedValue = createSignal(
  ([dependentSignal]) => `Computed value: ${dependentSignal()}`,
  [dependentSignal]
);
```

## Example Component

Below is a simplified example illustrating how to create a counter component that increments or decrements a count:

```html
<!-- Counter Component -->
<script type="module" name="x-counter">
  import { createSignal } from "/main.js";

  const [count, setCount] = createSignal(0);
  count.bindToText(refs.output);

  refs.inc.onclick = () => setCount(count() + 1);
  refs.dec.onclick = () => setCount(count() - 1);
</script>

<p ref="output"></p>
<button ref="inc">Increment</button>
<button ref="dec">Decrement</button>
```

This will create a custom element `<x-counter>` that can be used anywhere in your markup. Check out the `index.html` file for examples.

## Styling Components

Just add a script tag to your component and styles will be scoped using shadowDOM

```html
<style>
  button {
    padding: 15px;
  }
</style>
```

## Multiple components per file

Simple separate multiple components in a single file with a component boundary:

```
--- component boundary ---
```

See the `components.html` file for examples.
