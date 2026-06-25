# floater-ui

Floating UI elements for the browser - dropdowns, popovers, tooltips, context menus, modals and more. No dependencies.

Install as `floater-ui`; the library exposes a global called `Floater`.

> **Early build.** This was extracted from a WIP feature on [dbd-randomizer.com](https://dbd-randomizer.com) to be shared and reused across other projects. The API is not stable - a lot will likely change before a 1.0 release. Use with that in mind.

## Install

**npm**
```bash
npm install floater-ui
```

**CDN**
```html
<script src="https://unpkg.com/floater-ui@0.1.0/floater.js"></script>
```

**Manual** - download `floater.js` and include it directly:
```html
<script src="floater.js"></script>
```

## Quick start

```js
const menu = Floater.create('main-menu', 'dropdown', {
    items: ['Cut', 'Copy', 'Paste'],
});

menu.on('change', ({ value }) => console.log(value));

Floater.bind(document.querySelector('#menu-btn'), menu, { trigger: 'click' });
```

## Built-in types

| Type | Description |
|---|---|
| `dropdown` | List of selectable options |
| `number-picker` | Preset number values |
| `text-suggestions` | Autocomplete suggestions for a text input |
| `popover` | Generic content popover |
| `chips` | Multi-select chip group |
| `slider` | One or more range sliders |
| `input-group` | Form panel with mixed inputs (text, select, checkbox, date, slider, etc.) |
| `date` | Spinner date picker (YYYY-MM-DD) |
| `time` | Spinner time picker (HH:MM or HH:MM:SS) |
| `datetime` | Combined date + time spinner |
| `fetch` | Fetches a URL and renders the response (auto-detects image/audio/video/HTML) |
| `audio` | Audio player |
| `video` | Video player |
| `image` | Image viewer |
| `persist` | Persistent panel - stays open until explicitly closed |
| `modal` | Modal with backdrop |
| `context-menu` | Right-click context menu |

## API

### `Floater.create(id, type, opts)`

Creates a floater and registers it. If a floater with the same `id` already exists it is destroyed first.

```js
const tip = Floater.create('my-tip', 'popover', { content: '<p>Hello</p>' });
```

Returns a `FloaterInstance`.

### `Floater.attach(id, el, opts)`

Registers an existing DOM element as a floater. The element stays in the DOM and is moved into the floater container when opened, then returned to its original position when closed.

```js
const panel = Floater.attach('side-panel', document.querySelector('#panel'));
```

### `Floater.bind(anchor, instance, opts)`

Wires a trigger between an anchor and a floater. `anchor` can be an element, a CSS selector string, a `NodeList`, or an array.

Returns a cleanup function. Also auto-registered on `instance.destroy()`.

```js
Floater.bind('#open-btn', menu, { trigger: 'click' });
Floater.bind(document.querySelectorAll('.tip-anchor'), tooltip, { trigger: 'hover' });
```

**Bind opts:**

| Opt | Default | Description |
|---|---|---|
| `trigger` | `'click'` | `'click'` / `'hover'` / `'focus'` / `'contextmenu'` / `'press'` |
| `hoverDelay` | `200` | ms before hover closes (hover only) |
| `hoverOpenDelay` | `0` | ms before hover opens (hover only) |
| `scrollSelect` | - | `true` to use the type's built-in scroll handler, or `(instance, delta, e) => {}` for custom behaviour |

`trigger: 'press'` - opens on mousedown/touchstart; dragging highlights `[data-value]` items under the pointer; releasing selects the hovered item.

`scrollSelect` - fires on wheel over the anchor or the floater. Built-in support: `dropdown` cycles through items, `number-picker` cycles through presets.

### `Floater.get(id)`

Returns the `FloaterInstance` for `id`, or `null`.

### `Floater.has(id)`

Returns `true` if a floater with `id` is registered.

### `Floater.remove(id)`

Destroys and unregisters the floater.

### `Floater.closeAll([filter], [opts])`

Closes all open floaters. Pass a filter function `(instance) => bool` to close a subset. Modal and protected floaters are skipped unless `opts.includeProtected` is `true`.

### `Floater.registerType(name, def)`

Registers a custom type. See [Custom types](#custom-types).

### `Floater.setDefaults(opts)` / `Floater.setDefaults(type, opts)`

Sets default opts for all floaters, or for a specific type.

```js
Floater.setDefaults({ gap: 8, closeOnScroll: true });
Floater.setDefaults('dropdown', { minWidth: 120 });
```

### `Floater.logger(fn, [filter])`

Attaches a debug logger. `fn` receives `(level, message, data)`. Pass a string or regex as `filter` to limit which events are logged.

```js
Floater.logger(console.log);
Floater.logger(console.log, 'position');
```

---

## FloaterInstance

### Properties

| Property | Description |
|---|---|
| `id` | The id the floater was created with |
| `el` | The floater DOM element |
| `type` | The type name |
| `isOpen` | `true` while open |
| `opts` | Current opts object |

### Methods

#### `instance.open(anchor, [openOpts])`

Opens the floater positioned relative to `anchor`. `anchor` can be an element, a `MouseEvent`, or a `{x, y}` / `{clientX, clientY}` / `{left, top}` point.

#### `instance.close([closeOpts])`

Closes the floater.

#### `instance.toggle(anchor, [opts])`

Opens if closed, closes if open.

#### `instance.update(opts)`

Merges `opts` into the instance opts and calls the type's `onUpdate` hook (rebuilds content for built-in types). Chainable.

#### `instance.on(event, fn)`

Subscribes to an event. `fn` receives `(data, instance)`. Chainable.

#### `instance.off(event, fn)`

Unsubscribes. Chainable.

#### `instance.emit(event, data)`

Emits an event on the instance. Chainable.

#### `instance.destroy()`

Closes, unregisters, and removes the floater. Runs all registered cleanup functions.

---

## Events

| Event | Emitted when | Data |
|---|---|---|
| `show` | Opened | `{ anchor, opts }` |
| `hide` | Closed | `{ opts }` |
| `update` | `update()` called | the opts passed to `update()` |
| `destroy` | Destroyed | `{}` |
| `change` | Value selected/changed (type-dependent) | `{ value, ... }` |
| `input` | Field input in `input-group` | `{ name, value, type, el }` |
| `loaded` | Content loaded (`fetch`/`audio`/`video`/`image`) | `{ url }` or `{ src }` |
| `error` | Load error (`fetch`/`audio`/`video`/`image`) | `{ url/src, error }` |
| `timeupdate` | Playback progress (`audio`/`video`) | `{ currentTime, duration }` |

```js
menu.on('change', ({ value }) => console.log('selected:', value));
menu.on('hide', () => console.log('closed'));
```

---

## Instance opts

These can be passed to `create()`, `attach()`, `open()`, or `toggle()`.

### Positioning

| Opt | Default | Description |
|---|---|---|
| `gap` | `4` | px gap between anchor and floater |
| `preferAbove` | `false` | Open above the anchor when there is room |
| `preferRight` | `false` | Open to the right (side mode) |
| `preferLeft` | `false` | Open to the left (side mode) |
| `centerX` | `false` | Centre horizontally on the anchor |
| `centerY` | `false` | Centre vertically on the anchor (side mode) |
| `minWidth` | - | Minimum width in px |
| `fitContent` | `false` | Match anchor width |

### Behaviour

| Opt | Description |
|---|---|
| `modal` | Shows backdrop; immune to outside-click and scroll close |
| `blockScroll` | Locks `body` scroll while open; ref-counted across stacked modals |
| `blockClicks` | Backdrop absorbs clicks entirely - floater must be dismissed via its own UI |
| `persistOnOutsideClick` | Outside clicks do nothing; scroll repositions |
| `protected` | Same immunity as `modal` but no backdrop |
| `closeOnOutsideClick: false` | Outside clicks don't close, but scroll still repositions |
| `closeOnScroll: true` | Closes on scroll instead of repositioning |
| `closeOthers: false` | Don't close other floaters when this one opens |
| `closeOthersImmune` | Skip this floater when another floater calls `closeOthers` |
| `closeOnEscape: false` | Don't close on Escape |
| `closeButton` | Injects an × button into the floater element |
| `toFrontOn` | `'click'` (default) / `'hover'` / `'none'` - z-index bump on interaction |
| `noContextMenu` | Blocks the global context menu from opening over this floater |

### Markers

`currentValue` and `preferenceValue` highlight matching items in `dropdown`, `chips`, and nested types using layout-inert CSS classes (no reflow).

---

## Custom types

```js
Floater.registerType('my-type', {
    // Required: build the floater element and return it
    build(opts) {
        const el = document.createElement('div');
        el.className = 'fs-floater';
        el.textContent = opts.message || '';
        return el;
    },

    // Optional: called after the instance is created
    init(instance, opts) {},

    // Optional: called before open(); return false to cancel
    onOpen(instance, anchor, opts) {},

    // Optional: called on close
    onClose(instance, opts) {},

    // Optional: called on instance.update()
    onUpdate(instance, updateOpts) {},

    // Optional: called on outside click (default behaviour is instance.close())
    onClickOutside(instance) { instance.close(); },

    // Optional: called when scrollSelect fires; delta is +1 (down) or -1 (up)
    onScrollSelect(instance, delta, event) {},

    // Optional: called on press trigger item release (default is el.click())
    onPressSelect(instance, el) {},
});
```

---

## License

This library is licensed under the [MIT](LICENSE).
