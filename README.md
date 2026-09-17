# floater-ui

Floating UI elements for the browser - dropdowns, popovers, tooltips, context menus, modals, pickers and more. One file, no dependencies, no build step.

Install as `floater-ui`; the library exposes a global called `Floater`.

**[Live demo](https://alphaproject1998.github.io/floater-ui/demo.html)** - every type and feature, interactive.

> **Early build.** This was extracted from a WIP feature on [dbd-randomizer.com](https://dbd-randomizer.com) to be shared and reused across other projects. The API is not stable - a lot will likely change before a 1.0 release. Use with that in mind.

## Why

Most floating-element libraries give you positioning and leave the rest to you. floater-ui manages the whole lifecycle: a central registry, viewport-aware positioning that survives scrolling and transformed ancestors, trigger wiring (click, hover, focus, right-click, press-and-drag), stacking and focus classes, animations, events, and 17 ready-made content types. Custom types are first-class citizens.

- **Registry-based** - every floater has an id; query, update, or close any of them from anywhere
- **Positioning that holds up** - flips above/below or left/right when space runs out, follows the anchor on scroll, compensates for `transform`/`filter` ancestors that break `position: fixed`
- **Layered opts** - global defaults → type defaults → instance opts → open-time opts; pass `modal: true` to a single `open()` call and it behaves as a modal just that once
- **Loud failures** - API misuse warns on the console instead of silently doing nothing

## Install

**npm**
```bash
npm install floater-ui
```

**CDN**
```html
<script src="https://unpkg.com/floater-ui@0.2.2/floater.js"></script>
```

**Manual** - download `floater.js` and include it directly:
```html
<script src="floater.js"></script>
```

## Quick start

```js
const menu = Floater.create('main-menu', 'dropdown', {
    items: [
        { value: 'cut', label: 'Cut' },
        { value: 'copy', label: 'Copy' },
        { value: 'paste', label: 'Paste' },
    ],
});

menu.on('change', ({ value }) => console.log(value));

Floater.bind('#menu-btn', menu, { trigger: 'click' });
```

That's a working dropdown: positioned against the button, flips when near the viewport edge, follows the anchor on scroll, closes on outside click and Escape.

## Built-in types

| Type | Description |
|---|---|
| `dropdown` | List of selectable options |
| `number-picker` | Preset number values |
| `text-suggestions` | Autocomplete suggestions for a text input |
| `popover` | Generic content popover |
| `chips` | Multi-select chip group |
| `slider` | One or more range sliders |
| `input-group` | Form panel with mixed inputs (text, select, checkbox, nested floater types) |
| `date` | Spinner date picker (YYYY-MM-DD) |
| `time` | Spinner time picker (HH:MM or HH:MM:SS) |
| `datetime` | Combined date + time spinner |
| `fetch` | Fetches a URL and renders the response (auto-detects JSON/image/audio/video) |
| `audio` | Audio player |
| `video` | Video player |
| `image` | Image viewer |
| `persist` | Persistent panel - stays open until explicitly closed |
| `modal` | Modal with backdrop |
| `context-menu` | Right-click context menu with icons, shortcuts, separators |

## API

### `Floater.create(id, type, opts)`

Creates a floater and registers it. If a floater with the same `id` already exists it is destroyed first. Returns a `FloaterInstance`.

```js
const tip = Floater.create('my-tip', 'popover', { content: '<p>Hello</p>' });
```

### `Floater.attach(id, el, opts)`

Registers an existing DOM element as a floater instead of building one. The element is wrapped in place, moved into the floater container while open, and returned to its original position on close. `destroy()` unwraps it back into the page exactly where it started.

```js
const panel = Floater.attach('side-panel', document.querySelector('#panel'), { type: 'dropdown' });
```

Pass `type` to get a built-in type's behaviour wired onto your markup; omit it for arbitrary content. A pre-set `hidden` attribute on the element is respected, and an element that was visible inline is visible again once the floater closes.

### `Floater.bind(anchor, instance, opts)`

Wires a trigger between an anchor and a floater. `anchor` can be an element, a CSS selector string, a `NodeList`, or an array; multi-element anchors all share the one floater.

Returns a cleanup function (or an array of them for multiple anchors). Cleanup is also run automatically on `instance.destroy()`.

```js
Floater.bind('#open-btn', menu, { trigger: 'click' });
Floater.bind(document.querySelectorAll('.tip-anchor'), tooltip, { trigger: 'hover' });
```

**Bind opts:**

| Opt | Default | Description |
|---|---|---|
| `trigger` | `'click'` | `'click'` / `'hover'` / `'focus'` / `'contextmenu'` / `'press'` / `'none'`. `'click'` also opens on Enter and Space when the anchor is focused |
| `hoverDelay` | `200` | ms before hover closes (hover only) |
| `hoverOpenDelay` | `0` | ms before hover opens (hover only) |
| `scrollSelect` | - | `true` to use the type's built-in scroll handler, or `(instance, delta, e) => {}` for custom behaviour |

Any positioning/behaviour opts passed to `bind()` are forwarded to `open()`, so per-trigger `gap`, `centerX`, `arrowEl` etc. work here too.

`trigger: 'press'` - opens on mousedown/touchstart; dragging highlights `[data-value]` items under the pointer; releasing selects the highlighted item.

`trigger: 'none'` - no open trigger at all; useful for scrollSelect-only bindings or floaters you open programmatically.

`scrollSelect` - fires on wheel over the anchor **or** the floater, even while closed. Built-in support: `dropdown` cycles items, `number-picker` cycles presets or steps a number (`scrollMode: 'step'`), `date`/`time`/`datetime` change per-column when the wheel is over a spinner column.

### Lookup and bulk operations

| Method | Description |
|---|---|
| `Floater.get(id)` | The `FloaterInstance` for `id`, or `null` |
| `Floater.has(id)` | `true` if `id` is registered |
| `Floater.remove(id)` | Destroys and unregisters the floater |
| `Floater.getAll([filter])` | All registered instances matching the filter |
| `Floater.getOpen([filter])` | All currently open instances matching the filter |
| `Floater.closeAll([filter], [opts])` | Closes matching open floaters |

Filters accept a predicate function `(instance) => bool`, a type-name string, or an object with any of `{ type, id, idPrefix, open }`:

```js
Floater.getOpen('dropdown');
Floater.getAll({ idPrefix: 'toolbar-' });
Floater.closeAll(i => i.type !== 'modal');
```

`closeAll` skips modal and protected floaters unless `opts.includeProtected` is `true`.

### `Floater.setDefaults(opts)` / `Floater.setDefaults(type, opts)`

Sets default opts globally or for one type. Applied at `create()`/`attach()` time; the full priority chain (lowest to highest) is global defaults → type defaults → instance opts → open-time opts.

```js
Floater.setDefaults({ gap: 8, animateIn: 'fade', animateOut: 'fade' });
Floater.setDefaults('dropdown', { minWidth: 120 });
```

### `Floater.on(event, fn)` / `Floater.off(event, fn)`

Global event hooks that fire for every instance, lifecycle and custom events alike. `fn` receives `(instance, payload)`.

```js
Floater.on('show', (instance, { trigger }) => console.log(`${instance.id} opened via ${trigger}`));
```

### `Floater.registerType(name, def)`

Registers a custom type. See [Custom types](#custom-types).

### `Floater.registerAnimation(name, def)`

Registers a custom animation. See [Animations](#animations).

### `Floater.logger(fn, [filter])`

Attaches a logger. `fn` receives `(level, message, data)` where `level` is `'event'`, `'info'`, `'warn'`, or `'error'`. `filter` narrows it: a level string, an array of levels, or a predicate `(level, msg, data) => bool`.

```js
Floater.logger(console.log);                 // everything
Floater.logger(console.log, 'event');        // lifecycle + custom events only
Floater.logger(console.log, ['warn', 'error']);
```

Independent of any logger, warnings and errors (API misuse, crashed event handlers, bad animation names, a fetch floater with no URL) always go to the browser console with a `[Floater]` prefix. Misuse is never silent.

---

## FloaterInstance

### Properties

| Property | Description |
|---|---|
| `id` | The id the floater was created with |
| `el` | The floater DOM element (`.fs-floater` wrapper) |
| `type` | The type name |
| `isOpen` | `true` while open |
| `opts` | Current instance opts object |

### Methods

#### `instance.open(anchor, [openOpts])`

Opens the floater positioned relative to `anchor`: an element, a `MouseEvent`, or a `{x, y}` / `{clientX, clientY}` / `{left, top}` point. No anchor positions at the viewport origin.

`openOpts` layer over the instance opts for this open only; `open(btn, { modal: true })` gives one modal open of an otherwise normal floater, including the backdrop and outside-click immunity.

#### `instance.close([closeOpts])`

Closes the floater. No-op if already closed.

#### `instance.toggle(anchor, [opts])`

Opens if closed, closes if open.

#### `instance.update(opts)`

Merges `opts` into the instance opts and calls the type's `onUpdate` hook; built-in types rebuild their content when you pass new `items`/`presets`/`value` etc. Marker highlights are reapplied automatically after a rebuild. Chainable.

#### `instance.on(event, fn)` / `instance.off(event, fn)`

Subscribe/unsubscribe. `fn` receives `(payload, instance)`. A handler that throws is logged as an error and does not stop later handlers. Chainable.

#### `instance.emit(event, data)`

Emits a custom event on the instance; instance handlers, global `Floater.on()` handlers, and the logger all see it. Chainable.

#### `instance.destroy()`

Closes (skipping any exit animation), runs all registered cleanups, unregisters, and removes the element from the DOM. Attached floaters are unwrapped back into their original position. Calling `open()` on a destroyed instance warns instead of half-working.

---

## Events

Full lifecycle, in firing order:

| Event | Emitted when | Data |
|---|---|---|
| `create` | Instance created via `create()`/`attach()` | `{}` |
| `trigger` | An open is initiated | `{ anchor, trigger }` |
| `show` | Opened and positioned | `{ anchor, opts, trigger }` |
| `shown` | Enter animation finished (immediately if none) | `{ trigger }` |
| `update` | `update()` called | the opts passed to `update()` |
| `hide` | Close initiated | `{ opts, trigger }` |
| `hidden` | Exit animation finished, element hidden | `{ trigger }` |
| `destroy` | Destroyed | `{}` |

Type-specific events:

| Event | Emitted when | Data |
|---|---|---|
| `change` | Value selected/changed | `{ value, ... }` (type-dependent) |
| `input` | Field input in `input-group` | `{ name, value, type, el }` |
| `loaded` | Content loaded (`fetch`/`image`) | `{ url }` or `{ src }` |
| `error` | Load error (`fetch`/`image`) | `{ url/src, error }` |
| `timeupdate` | Playback progress (`audio`/`video`) | `{ currentTime, duration }` |
| `ended` | Playback finished (`audio`/`video`) | `{}` |

Every payload also carries `id`, `type`, `opts`, and `trigger`. The trigger is how the event came about: `'click'`, `'hover'`, `'focus'`, `'contextmenu'`, `'press'`, `'keyboard'`, `'escape'`, `'scroll'`, or `'programmatic'`.

```js
menu.on('change', ({ value }) => console.log('selected:', value));
menu.on('hidden', ({ trigger }) => console.log('closed via', trigger));
```

Set `onChange: false` on an instance to suppress its `change`/`input` emissions entirely.

---

## Instance opts

These can be passed to `create()`, `attach()`, `setDefaults()`, or per-call to `open()`/`toggle()`/`bind()`.

### Positioning

| Opt | Default | Description |
|---|---|---|
| `gap` | `4` | px gap between anchor and floater |
| `preferAbove` | `false` | Open above the anchor when there is room |
| `preferRight` | `false` | Open to the right (side mode) |
| `preferLeft` | `false` | Open to the left (side mode) |
| `centerX` | `false` | Centre horizontally on the anchor |
| `centerY` | `false` | Centre vertically on the anchor (side mode) |
| `minWidth` | anchor width | Minimum width in px |
| `fitContent` | `false` | Size to content instead of matching the anchor width |
| `arrowEl` | - | An element to rotate to point at the floater (e.g. a ▶ in the anchor) |

Positioning is viewport-aware: the floater flips to the other side when space runs out, gets capped and scrollable when taller than the viewport, and accounts for ancestor `transform`/`filter`/`backdrop-filter` that would otherwise break `position: fixed`.

**Scroll behaviour:** by default an open floater follows its anchor as the page (or any scrollable ancestor) scrolls, even if the anchor is removed from the DOM mid-scroll. Set `closeOnScroll: true` to close instead. `modal` and `protected` floaters ignore scroll entirely.

### Behaviour

| Opt | Description |
|---|---|
| `modal` | Shows backdrop; immune to outside-click and scroll close; backdrop click and Escape close the topmost non-protected modal |
| `blockScroll` | Locks `body` scroll while open; ref-counted across stacked modals; restores the previous overflow value |
| `blockClicks` | Backdrop absorbs clicks entirely and Escape is ignored; dismiss via the floater's own UI only |
| `persistOnOutsideClick` | Outside clicks and clicks inside other floaters do nothing; scroll still repositions |
| `protected` | Same immunity as `modal` but no backdrop; Escape ignored |
| `closeOnOutsideClick: false` | Outside clicks don't close, but scroll still repositions |
| `closeOnScroll: true` | Closes on scroll instead of repositioning |
| `closeOthers: false` | Don't close other floaters when this one opens |
| `closeOthersImmune` | Skip this floater when another floater's `closeOthers` runs |
| `closeOnFloaterClick: false` | Stay open when a click lands inside a different floater |
| `closeOnEscape: false` | Don't close on Escape |
| `closeButton` | Injects an × button into the floater (`closeButtonLabel`, `closeButtonTitle` to customise) |
| `toFrontOn` | `'click'` (default) / `'hover'` / `'none'` - z-index bump on interaction |
| `noContextMenu` | Blocks a global context menu from opening over this floater |
| `onChange: false` | Suppress `change`/`input` events for this instance |

Escape closes the topmost eligible floater by z-index, one per press, so stacked floaters unwind in visual order.

### Stacking and focus

The topmost open floater gets the class `fs-focused`; every other open one gets `fs-blurred`. Both are unstyled hooks: style them yourself (dim blurred floaters, glow the focused one, whatever fits).

### Markers

`currentValue` / `preferenceValue` highlight matching `[data-value]` items with layout-inert classes (`fs-opt-current` / `fs-opt-preferred`: inset box-shadows, no reflow) plus a tooltip. Works in `dropdown`, `number-picker`, `text-suggestions`, `context-menu`, and nested `input-group` types.

| Opt | Default | Description |
|---|---|---|
| `currentValue` | - | Marks the currently active item |
| `preferenceValue` | - | Marks the preferred/default item |
| `currentTitle` | `'Active'` | Tooltip for the current marker |
| `preferenceTitle` | `'Default'` | Tooltip for the preference marker |
| `valueAttr` | `'data-value'` | Attribute matched against |

Markers survive content rebuilds; `update({ items })` reapplies them.

---

## Type-specific opts

The essentials per type; see the [demo](https://alphaproject1998.github.io/floater-ui/demo.html) source for every combination in use.

| Type | Key opts |
|---|---|
| `dropdown` | `items: [{ value, label, selected? }]` |
| `number-picker` | `presets: []`, `scrollMode: 'presets' \| 'step'`, `step`, `min`, `max` |
| `text-suggestions` | `suggestions: []` - strings or `{ value, label }` |
| `popover` / `persist` / `modal` | `content` - an HTML string |
| `chips` | `items`, `selectedValues`, `preferenceValues`, `maxSelect`, `closeOnMax` |
| `slider` | `sliders: [{ name, label, min, max, step, value }]` |
| `input-group` | `inputs: [{ type, name, label, value, ... }]` - native input types, `select`, `textarea`, `checkbox`, or any registered floater type nested as a sub-field |
| `date` / `time` / `datetime` | `value`, `step` (seconds; `< 60` shows a seconds column), `showArrows`, `showPicker`, `allowTyping`, `scrollPanel`, `scrollCols` |
| `fetch` | `url`, `fetchMethod: 'fetch' \| 'xhr'`, `responseType: 'auto' \| 'json' \| 'image' \| 'video' \| 'audio'`, `transform(text, contentType)` |
| `audio` / `video` | `src`, `autoplay`, `rememberProgress`, `resetOnOpen`, `resetOnClose` (+ `poster`, `muted`, `width` for video) |
| `image` | `src`, `alt`, `caption`, `width` |
| `context-menu` | `items: [{ value, label, icon?, shortcut?, danger?, disabled? } \| { separator: true }]`, `global: true` to take over right-click for the whole page, `excludeSelectors` |

Notes:

- The date/time spinners include an invisible native input, so the platform's own calendar/clock picker is one tap away (`showPicker`), and columns support typing, arrow buttons, and scroll-wheel changes with proper carry (minutes roll hours, month lengths respected).
- `fetch` escapes text responses before rendering; only your own `transform` output is treated as trusted HTML. Load failures render an error panel and emit `error`.
- `input-group` nests other floater types as form fields; their events are re-emitted through the parent with `name` and `subType` attached.

---

## Animations

Opt-in per instance or via defaults. Built-in presets: `fade`, `scale`, `slide-down`, `slide-up`, `slide-left`, `slide-right`, `spring`, `flip`, `unfold`, `shift-away`, `shift-toward`.

`shift-away` and `shift-toward` are directional: they read the side the floater actually opened on and shift on that axis, away from the anchor or toward it. `unfold` grows from the top edge.

| Opt | Description |
|---|---|
| `animateIn` / `animateOut` | Preset or registered animation name |
| `animationDuration` / `animationEasing` | Shared duration (ms) / easing |
| `animateInDuration`, `animateInEasing`, `animateOutDuration`, `animateOutEasing` | Per-direction overrides |

```js
Floater.create('tip', 'popover', {
    content: '<p>Hi</p>',
    animateIn: 'slide-down',
    animateOut: 'fade',
    animateOutDuration: 100,
});
```

Custom animations are a pair of CSS classes you own. The library applies the class, forces a reflow so the start frame renders, transitions to the resting state, and cleans up on `transitionend`:

```css
.my-swing {
    opacity: 0;
    transform: rotate(-7deg) translateY(-16px);
}
```

```js
Floater.registerAnimation('swing', {
    inClass: 'my-swing',
    outClass: 'my-swing',
    duration: 260,
    easing: 'cubic-bezier(.2,.8,.2,1)',
});
```

Animations can be swapped at runtime with `instance.update({ animateIn: 'scale' })`, no recreate needed.

---

## Custom types

Custom types get everything the built-ins get: positioning, triggers, events, markers, animations, scroll handling.

```js
Floater.registerType('my-type', {
    // Required: build and return the floater's content. The outer .fs-floater
    // wrapper (id, className, hidden, noContextMenu) is handled by the system -
    // don't create it yourself.
    build(opts) {
        const content = document.createElement('div');
        content.textContent = opts.message || '';
        return content;
    },

    // Optional: called once after the instance is created; wire events here.
    // Delegate to instance.el rather than child elements so listeners survive
    // content rebuilds from update().
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

    // Optional: called on press-trigger item release (default is el.click())
    onPressSelect(instance, el) {},

    // Optional type-level flags
    zPriority: 0,             // z-index boost on top of the global counter
    closeOthersImmune: false, // skip this type when other floaters close others
});
```

All library classes are prefixed `fs-` and custom properties `--fs-` to stay out of your page's way.

---

## License

This library is licensed under the [MIT](LICENSE).
