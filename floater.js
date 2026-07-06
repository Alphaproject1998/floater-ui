/*!
 * floater-ui v0.2.0
 * https://github.com/Alphaproject1998/floater-ui
 * (c) 2026 Jack Briggs - MIT License
 */
const Floater = (() => {
    'use strict';

    let _container = null;
    let _backdrop = null;
    let _logger = null;
    let _loggerFilter = null;
    let _defaults = {};
    const _typeDefaults = {};
    let _openCount = 0;
    let _zCounter = 0;
    let _scrollBlockCount = 0;
    const _registry = new Map();
    const _types = {};
    const _globalHandlers = {};
    const _animations = {};
    for (const name of ['fade', 'scale', 'slide-down', 'slide-up', 'slide-left', 'slide-right']) {
        _animations[name] = { inClass: `fs-anim-${name}-enter`, outClass: `fs-anim-${name}-exit`, duration: 150, easing: 'ease' };
    }

    (() => {
        const s = document.createElement('style');
        s.id = 'FloaterStyles';
        s.textContent = [
            '#FloaterContainer{position:fixed;top:0;left:0;pointer-events:none;z-index:9000;width:0;height:0;overflow:visible;}',
            '#FloaterContainer>*{pointer-events:auto;}',
            // Base visual style - all floaters (create() and attach()) get this; callsite CSS overrides as needed
            '.fs-floater{background:#1e1e1e;border:1px solid rgba(255,255,255,0.15);border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,0.65),0 1px 4px rgba(0,0,0,0.3);color:rgba(255,255,255,0.85);font-size:13px;font-family:inherit;}',
            '.fs-floater[hidden]{display:none!important;}',
            // Close button - positioned absolute inside floater; floater must be position:relative
            '.fs-floater:has(.fs-close-btn){position:relative;}',
            '.fs-close-btn{position:absolute;top:5px;right:6px;background:none;border:none;color:rgba(255,255,255,0.35);cursor:pointer;font-size:16px;line-height:1;padding:2px 5px;border-radius:3px;transition:color 0.1s,background 0.1s;z-index:1;}',
            '.fs-close-btn:hover{color:white;background:rgba(255,255,255,0.1);}',
            // Marker classes - layout-inert (no size/reflow changes); callsite CSS can override
            '.fs-opt-current{box-shadow:inset 3px 0 0 rgba(255,255,255,0.65);}',
            '.fs-opt-preferred{box-shadow:inset -3px 0 0 rgba(255,255,255,0.45);}',
            '.fs-opt-current.fs-opt-preferred{box-shadow:inset 3px 0 0 rgba(255,255,255,0.65),inset -3px 0 0 rgba(255,255,255,0.45);}',
            '.fs-dropdown{display:flex;flex-direction:column;overflow:hidden;}',
            '.fs-dropdown-option{padding:6px 12px;cursor:pointer;white-space:nowrap;color:rgba(255,255,255,0.8);transition:background 0.1s,color 0.1s;}',
            '.fs-dropdown-option:hover{background:rgba(255,255,255,0.09);color:white;}',
            '.fs-dropdown-option.fs-opt-selected{font-weight:500;background:rgba(255,255,255,0.06);color:white;}',
            '.fs-number-picker{display:flex;flex-direction:column;gap:1px;padding:4px;}',
            '.fs-number-picker-preset{padding:4px 12px;font-size:12px;background:none;border:1px solid transparent;border-radius:4px;cursor:pointer;text-align:center;white-space:nowrap;color:rgba(255,255,255,0.8);transition:background 0.1s,border-color 0.1s,color 0.1s;}',
            '.fs-number-picker-preset:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:white;}',
            '.fs-text-suggestions{display:flex;flex-direction:column;overflow:hidden;}',
            '.fs-text-suggestion{padding:6px 12px;cursor:pointer;white-space:nowrap;color:rgba(255,255,255,0.8);transition:background 0.1s,color 0.1s;}',
            '.fs-text-suggestion:hover{background:rgba(255,255,255,0.09);color:white;}',
            '.fs-popover{display:block;}',
            '.fs-chips{display:flex;flex-wrap:wrap;gap:4px;padding:6px;}',
            '.fs-chip{padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;border:1px solid rgba(255,255,255,0.22);color:rgba(255,255,255,0.65);user-select:none;white-space:nowrap;transition:border-color 0.1s,color 0.1s,background 0.1s;}',
            '.fs-chip:hover{border-color:rgba(255,255,255,0.5);color:white;}',
            '.fs-chip-selected{background:rgba(255,255,255,0.14);border-color:rgba(255,255,255,0.5);color:white;}',
            '.fs-chip-preferred{border-style:dashed;border-color:rgba(255,255,255,0.45);}',
            '.fs-chip-selected.fs-chip-preferred{border-style:dashed;}',
            '.fs-slider-panel{display:flex;flex-direction:column;gap:8px;padding:8px 10px;min-width:160px;}',
            '.fs-slider-row{display:flex;flex-direction:column;gap:3px;}',
            '.fs-slider-header{display:flex;justify-content:space-between;align-items:baseline;}',
            '.fs-slider-label{font-size:11px;color:rgba(255,255,255,0.5);}',
            '.fs-slider-value{font-size:11px;color:rgba(255,255,255,0.85);min-width:2ch;text-align:right;}',
            '.fs-slider-input{width:100%;cursor:pointer;accent-color:rgba(255,255,255,0.8);}',
            '.fs-input-group{display:flex;flex-direction:column;gap:6px;padding:8px;min-width:180px;}',
            '.fs-input-row{display:flex;flex-direction:column;gap:3px;}',
            '.fs-input-label{font-size:11px;color:rgba(255,255,255,0.5);}',
            '.fs-input-checkbox-row{display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;color:rgba(255,255,255,0.8);}',
            '.fs-input-field{background:rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.22);color:white;border-radius:4px;padding:4px 7px;font-size:12px;width:100%;box-sizing:border-box;transition:border-color 0.1s;}',
            '.fs-input-field:focus{border-color:rgba(255,255,255,0.55);outline:none;}',
            '.fs-spinner-panel{padding:8px;position:relative;}',
            '.fs-spinner{display:flex;align-items:center;gap:4px;}',
            '.fs-spinner-col{display:flex;flex-direction:column;align-items:center;gap:2px;}',
            '.fs-spinner-btn{background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);border-radius:3px;width:28px;height:20px;cursor:pointer;font-size:9px;display:flex;align-items:center;justify-content:center;transition:background 0.1s,border-color 0.1s,color 0.1s;padding:0;line-height:1;}',
            '.fs-spinner-btn:hover{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.3);color:white;}',
            '.fs-spinner-val{font-size:18px;font-variant-numeric:tabular-nums;color:white;width:2ch;text-align:center;padding:1px 3px;line-height:1.3;background:none;border:none;outline:none;box-sizing:content-box;cursor:text;font-family:inherit;}',
            '.fs-spinner-val[readonly]{cursor:default;}',
            '.fs-spinner-val.fs-spinner-year{width:4ch;}',
            '.fs-spinner-val:not([readonly]):focus{background:rgba(255,255,255,0.08);border-radius:3px;}',
            '.fs-spinner-sep{font-size:18px;color:rgba(255,255,255,0.3);align-self:center;padding-bottom:2px;line-height:1;}',
            // Inline picker icon button + invisible native input for showPicker()
            '.fs-picker-btn{background:none;border:none;cursor:pointer;font-size:16px;padding:0 2px;line-height:1;opacity:0.4;transition:opacity 0.15s;align-self:center;color:inherit;font-family:inherit;}',
            '.fs-picker-btn:hover{opacity:1;}',
            '.fs-native-picker{position:absolute;opacity:0;pointer-events:none;width:0;height:0;overflow:hidden;top:0;left:0;}',
            '.fs-fetch-panel{padding:8px;min-width:200px;}',
            '.fs-fetch-loading{font-size:12px;color:rgba(255,255,255,0.4);padding:8px 4px;text-align:center;}',
            '.fs-fetch-error{font-size:12px;color:rgba(255,100,100,0.8);padding:8px 4px;}',
            '.fs-fetch-content{font-size:12px;color:rgba(255,255,255,0.8);padding:4px;}',
            '.fs-fetch-content pre{font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:300px;overflow-y:auto;}',
            '.fs-fetch-content img,.fs-fetch-content video,.fs-fetch-content audio{max-width:100%;display:block;}',
            '.fs-context-menu{display:flex;flex-direction:column;padding:3px 0;min-width:150px;}',
            '.fs-ctx-item{display:flex;align-items:center;gap:8px;padding:5px 12px;cursor:pointer;color:rgba(255,255,255,0.8);transition:background 0.1s,color 0.1s;white-space:nowrap;user-select:none;}',
            '.fs-ctx-item:hover{background:rgba(255,255,255,0.09);color:white;}',
            '.fs-ctx-icon{font-size:14px;width:16px;text-align:center;flex-shrink:0;}',
            '.fs-ctx-label{font-size:13px;}',
            '.fs-ctx-shortcut{font-size:11px;color:rgba(255,255,255,0.3);margin-left:auto;padding-left:16px;}',
            '.fs-ctx-danger{color:rgba(255,110,110,0.9);}',
            '.fs-ctx-danger:hover{background:rgba(200,50,50,0.15);color:rgba(255,110,110,1);}',
            '.fs-ctx-disabled{opacity:0.35;cursor:default;pointer-events:none;}',
            '.fs-ctx-sep{border-top:1px solid rgba(255,255,255,0.09);margin:3px 0;}',
            '.fs-audio-panel{padding:10px;min-width:280px;}',
            '.fs-audio-el{width:100%;outline:none;display:block;}',
            '.fs-video-panel{padding:8px;min-width:300px;}',
            '.fs-video-el{width:100%;display:block;border-radius:3px;background:#000;}',
            '.fs-image-panel{padding:6px;display:flex;flex-direction:column;gap:6px;}',
            '.fs-image-el{display:block;max-width:100%;height:auto;border-radius:3px;}',
            '.fs-image-caption{font-size:11px;color:rgba(255,255,255,0.4);text-align:center;}',
            '.fs-persist-panel{display:block;}',
            '.fs-modal-panel{display:block;}',
            '#FloaterBackdrop{position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:8999;pointer-events:auto;display:none;}',
            '.fs-press-hover{background:rgba(255,255,255,0.09);color:white;}',
            '.fs-anim-fade-enter,.fs-anim-fade-exit{opacity:0;}',
            '.fs-anim-scale-enter,.fs-anim-scale-exit{opacity:0;transform:scale(0.9);}',
            '.fs-anim-slide-down-enter{opacity:0;transform:translateY(-8px);}',
            '.fs-anim-slide-down-exit{opacity:0;transform:translateY(8px);}',
            '.fs-anim-slide-up-enter{opacity:0;transform:translateY(8px);}',
            '.fs-anim-slide-up-exit{opacity:0;transform:translateY(-8px);}',
            '.fs-anim-slide-left-enter{opacity:0;transform:translateX(8px);}',
            '.fs-anim-slide-left-exit{opacity:0;transform:translateX(-8px);}',
            '.fs-anim-slide-right-enter{opacity:0;transform:translateX(-8px);}',
            '.fs-anim-slide-right-exit{opacity:0;transform:translateX(8px);}',
        ].join('');
        (document.head || document.documentElement).appendChild(s);
    })();

    function _getContainer() {
        if (!_container) {
            _container = document.createElement('div');
            _container.id = 'FloaterContainer';
            (document.body || document.documentElement).appendChild(_container);
        }
        return _container;
    }

    function _getBackdrop() {
        if (!_backdrop) {
            _backdrop = document.createElement('div');
            _backdrop.id = 'FloaterBackdrop';
            _backdrop.addEventListener('click', e => {
                e.stopPropagation();
                const open = [..._registry.values()].filter(i => i.isOpen && i._opts.modal);
                if (!open.length || open.some(i => i._opts.blockClicks)) return;
                const closeable = open.filter(i => !i._opts.protected);
                if (!closeable.length) return;
                closeable.sort((a, b) => parseInt(a.el.style.zIndex || 0) - parseInt(b.el.style.zIndex || 0));
                closeable[closeable.length - 1].close();
            });
            (document.body || document.documentElement).appendChild(_backdrop);
        }
        return _backdrop;
    }

    function _updateBackdropState() {
        if (!_backdrop) return;
        const anyModal = [..._registry.values()].some(i => i.isOpen && i._opts.modal);
        _backdrop.style.display = anyModal ? 'block' : 'none';
    }

    // .fs-focused / .fs-blurred are hooks only - no default styling. The consumer's own CSS
    // decides what a blurred floater looks like (e.g. dimmed via opacity + box-shadow).
    function _updateFocusClasses() {
        let top = null;
        let topZ = -Infinity;
        for (const inst of _registry.values()) {
            if (!inst.isOpen) continue;
            const z = parseInt(inst.el.style.zIndex, 10) || 0;
            if (z >= topZ) { topZ = z; top = inst; }
        }
        for (const inst of _registry.values()) {
            if (!inst.isOpen) continue;
            inst.el.classList.toggle('fs-focused', inst === top);
            inst.el.classList.toggle('fs-blurred', inst !== top);
        }
    }

    // Finds the nearest ancestor that creates a containing block for position:fixed.
    // transform / filter / backdrop-filter / will-change:transform all break viewport-relative fixed positioning.
    function _findCB(el) {
        let p = el.parentElement;
        while (p && p !== document.documentElement) {
            const s = getComputedStyle(p);
            if (
                s.transform !== 'none' ||
                s.filter !== 'none' ||
                (s.backdropFilter && s.backdropFilter !== 'none') ||
                s.willChange === 'transform'
            ) return p;
            p = p.parentElement;
        }
        return null;
    }

    function _getScrollAncestors(el) {
        const result = [];
        let p = el.parentElement;
        while (p && p !== document.documentElement) {
            const s = getComputedStyle(p);
            if (/auto|scroll/.test(s.overflowY + s.overflowX + s.overflow)) result.push(p);
            p = p.parentElement;
        }
        result.push(window);
        return result;
    }

    function _position(anchor, floater, opts) {
        opts = opts || {};
        const arrowEl = opts.arrowEl || null;
        const centerX = opts.centerX || false;
        const centerY = opts.centerY || false;
        const preferAbove = opts.preferAbove || false;
        const preferRight = opts.preferRight || false;
        const preferLeft = opts.preferLeft || false;
        const gap = opts.gap != null ? opts.gap : 4;
        const minWidth = opts.minWidth != null ? opts.minWidth : null;
        const fitContent = opts.fitContent || false;

        floater.style.position = 'fixed';
        floater.style.visibility = 'hidden';
        floater.style.minWidth = '';
        floater.style.maxHeight = 'none';
        floater.style.maxWidth = 'none';
        floater.style.overflowY = '';
        floater.style.top = '-9999px';
        floater.style.left = '0';
        floater.removeAttribute('hidden');
        const natH = floater.scrollHeight;
        const natW = floater.offsetWidth;
        floater.setAttribute('hidden', '');
        floater.style.visibility = '';
        floater.style.top = '';
        floater.style.left = '';
        floater.style.maxHeight = '';
        floater.style.maxWidth = '';

        let anchorRect;
        if (anchor && typeof anchor.getBoundingClientRect === 'function') {
            anchorRect = anchor.getBoundingClientRect();
        } else {
            const x = anchor ? (anchor.clientX ?? anchor.x ?? anchor.left ?? 0) : 0;
            const y = anchor ? (anchor.clientY ?? anchor.y ?? anchor.top ?? 0) : 0;
            anchorRect = { left: x, top: y, right: x, bottom: y, width: 0, height: 0 };
        }
        const vp = window.visualViewport;
        const vH = vp ? vp.height : window.innerHeight;
        const vW = vp ? vp.width : window.innerWidth;

        const cb = _findCB(floater);
        const cbRect = cb ? cb.getBoundingClientRect() : { left: 0, top: 0 };

        if (preferRight || preferLeft) {
            const spaceRight = vW - anchorRect.right - gap;
            const spaceLeft = anchorRect.left - gap;
            const openRight = preferRight
                ? (spaceRight >= natW || spaceRight >= spaceLeft)
                : (spaceLeft < natW && spaceRight > spaceLeft);
            const availW = Math.max(0, openRight ? spaceRight : spaceLeft);
            const actualW = Math.min(natW, availW);
            const actualH = Math.min(natH, vH - 8);

            let top = centerY
                ? anchorRect.top + anchorRect.height / 2 - actualH / 2
                : anchorRect.top;
            top = Math.max(4, Math.min(top, vH - actualH - 4));

            let sideLeft = openRight
                ? anchorRect.right + gap
                : anchorRect.left - actualW - gap;
            sideLeft = Math.max(4, Math.min(sideLeft, vW - actualW - 4));

            floater.style.position = 'fixed';
            floater.style.left = (sideLeft - cbRect.left) + 'px';
            floater.style.top = (top - cbRect.top) + 'px';
            floater.style.minWidth = (minWidth || 0) + 'px';
            floater.style.maxWidth = actualW + 'px';
            floater.style.maxHeight = actualH + 'px';
            floater.style.overflowY = natH > actualH ? 'auto' : 'hidden';
            floater.style.bottom = '';
            if (arrowEl) arrowEl.style.transform = openRight ? 'rotate(0deg)' : 'rotate(180deg)';
            floater.removeAttribute('hidden');
            return { openBelow: null, openRight, actualH, natH };
        }

        const spaceBelow = vH - anchorRect.bottom - gap;
        const spaceAbove = anchorRect.top - gap;
        const openBelow = preferAbove
            ? (spaceAbove < natH && spaceBelow > spaceAbove)
            : (spaceBelow >= natH || spaceBelow >= spaceAbove);
        const avail = openBelow ? spaceBelow : spaceAbove;
        const actualH = Math.min(natH, avail);

        const effectiveMinW = fitContent ? (minWidth || 0) : (minWidth != null ? minWidth : anchorRect.width);
        const layoutW = Math.min(Math.max(natW, effectiveMinW), vW - 8);

        let left = centerX
            ? anchorRect.left + anchorRect.width / 2 - layoutW / 2
            : anchorRect.left;
        left = Math.max(4, Math.min(left, vW - layoutW - 4));

        floater.style.position = 'fixed';
        floater.style.left = (left - cbRect.left) + 'px';
        floater.style.minWidth = effectiveMinW + 'px';
        floater.style.maxWidth = (vW - 8) + 'px';
        floater.style.maxHeight = actualH + 'px';
        floater.style.overflowY = natH > avail ? 'auto' : 'hidden';
        floater.style.bottom = '';

        if (openBelow) {
            floater.style.top = (anchorRect.bottom + gap - cbRect.top) + 'px';
        } else {
            floater.style.top = (anchorRect.top - actualH - gap - cbRect.top) + 'px';
        }
        if (arrowEl) arrowEl.style.transform = openBelow ? 'rotate(90deg)' : 'rotate(-90deg)';

        floater.removeAttribute('hidden');
        return { openBelow, actualH, natH };
    }

    function _unposition(floater, arrowEl) {
        floater.setAttribute('hidden', '');
        floater.style.position = '';
        floater.style.top = '';
        floater.style.left = '';
        floater.style.bottom = '';
        floater.style.minWidth = '';
        floater.style.maxWidth = '';
        floater.style.maxHeight = '';
        floater.style.overflowY = '';
        floater.style.visibility = '';
        if (arrowEl) arrowEl.style.transform = '';
    }

    function _resolveAnim(name) {
        return name ? (_animations[name] || null) : null;
    }

    // animateIn/OutDuration/Easing win over the shared animationDuration/Easing when in and out need to differ.
    function _effectiveAnim(anim, opts, direction) {
        if (!anim) return null;
        const durationOverride = direction === 'in' ? opts.animateInDuration : opts.animateOutDuration;
        const easingOverride = direction === 'in' ? opts.animateInEasing : opts.animateOutEasing;
        return {
            inClass: anim.inClass,
            outClass: anim.outClass,
            duration: durationOverride != null ? durationOverride : (opts.animationDuration != null ? opts.animationDuration : anim.duration),
            easing: easingOverride || opts.animationEasing || anim.easing,
        };
    }

    // Forces a reflow between setting the "from" state and enabling transitions, so an "in" animation
    // has a rendered starting frame to transition from despite the element being hidden the same tick.
    function _animate(el, anim, direction, done) {
        const duration = anim.duration != null ? anim.duration : 150;
        const easing = anim.easing || 'ease';
        const cls = direction === 'in' ? anim.inClass : anim.outClass;

        el.style.transition = 'none';
        if (direction === 'in') el.classList.add(cls);
        void el.offsetWidth;

        let raf;
        const cleanup = () => {
            el.removeEventListener('transitionend', onEnd);
            clearTimeout(fallback);
            cancelAnimationFrame(raf);
            el.style.transition = '';
        };
        const onEnd = e => {
            if (e.target !== el) return;
            el.classList.remove(cls);
            cleanup();
            done();
        };
        const fallback = setTimeout(() => onEnd({ target: el }), duration + 50);

        raf = requestAnimationFrame(() => {
            el.style.transition = `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`;
            el.addEventListener('transitionend', onEnd);
            if (direction === 'in') el.classList.remove(cls);
            else el.classList.add(cls);
        });

        return () => { el.classList.remove(cls); cleanup(); };
    }

    function _applyMarkers(el, opts) {
        const attr = opts.valueAttr || 'data-value';
        const cur = opts.currentValue != null ? String(opts.currentValue) : null;
        const pref = opts.preferenceValue != null ? String(opts.preferenceValue) : null;
        const curTitle = opts.currentTitle || 'Active';
        const prefTitle = opts.preferenceTitle || 'Default';
        for (const item of el.querySelectorAll(`[${attr}]`)) {
            const v = item.getAttribute(attr);
            const isCur = cur !== null && v === cur;
            const isPref = pref !== null && v === pref;
            item.classList.toggle('fs-opt-current', isCur);
            item.classList.toggle('fs-opt-preferred', isPref);
            if (isCur && isPref) {
                item.title = `${curTitle} - ${prefTitle}`;
            } else if (isCur) {
                item.title = curTitle;
            } else if (isPref) {
                item.title = prefTitle;
            } else {
                item.removeAttribute('title');
            }
        }
    }

    function _addCloseButton(instance) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fs-close-btn';
        btn.textContent = instance.opts.closeButtonLabel || '×';
        btn.title = instance.opts.closeButtonTitle || 'Close';
        btn.addEventListener('click', e => { e.stopPropagation(); instance.close(); });
        instance.el.insertBefore(btn, instance.el.firstChild);
    }

    function _daysInMonth(y, mo) {
        return new Date(y, mo, 0).getDate();
    }

    function _parseTime(val) {
        const parts = (val || '00:00:00').split(':').map(Number);
        return { h: parts[0] || 0, m: parts[1] || 0, s: parts[2] || 0 };
    }

    function _parseDate(val) {
        const parts = (val || '').split('-').map(Number);
        const now = new Date();
        return {
            y: parts[0] || now.getFullYear(),
            mo: parts[1] || (now.getMonth() + 1),
            d: parts[2] || now.getDate(),
        };
    }

    function _formatTime(h, m, s, showSec) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        return showSec ? `${hh}:${mm}:${String(s).padStart(2, '0')}` : `${hh}:${mm}`;
    }

    function _formatDate(y, mo, d) {
        return `${String(y).padStart(4, '0')}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }

    function _addSpinnerCol(container, seg, val, min, max, step, isYear, showArrows, allowTyping) {
        const col = document.createElement('div');
        col.className = 'fs-spinner-col';
        col.dataset.seg = seg;
        col.dataset.min = min;
        col.dataset.max = max;
        col.dataset.step = step;

        if (showArrows !== false) {
            const up = document.createElement('button');
            up.type = 'button';
            up.className = 'fs-spinner-btn';
            up.dataset.dir = 'up';
            up.textContent = '▲';
            col.appendChild(up);
        }

        const valEl = document.createElement('input');
        valEl.type = 'text';
        valEl.inputMode = 'numeric';
        valEl.className = isYear ? 'fs-spinner-val fs-spinner-year' : 'fs-spinner-val';
        valEl.dataset.seg = seg;
        if (allowTyping === false) valEl.readOnly = true;
        valEl.value = String(Math.round(val)).padStart(isYear ? 4 : 2, '0');
        col.appendChild(valEl);

        if (showArrows !== false) {
            const down = document.createElement('button');
            down.type = 'button';
            down.className = 'fs-spinner-btn';
            down.dataset.dir = 'down';
            down.textContent = '▼';
            col.appendChild(down);
        }

        container.appendChild(col);
    }

    function _addSpinnerSep(container, text) {
        const sep = document.createElement('div');
        sep.className = 'fs-spinner-sep';
        sep.textContent = text;
        container.appendChild(sep);
    }

    function _addNativePickerInput(panel, inputType, nativeClass, opts) {
        const inp = document.createElement('input');
        inp.type = inputType;
        inp.className = nativeClass + ' fs-native-picker';
        if (opts.value) inp.value = opts.value;
        if (opts.min != null) inp.min = opts.min;
        if (opts.max != null) inp.max = opts.max;
        if (opts.step != null) inp.step = opts.step;
        panel.appendChild(inp);
        return inp;
    }

    function _addPickerBtn(spinner, nativeInput, icon) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fs-picker-btn';
        btn.textContent = icon;
        btn.title = 'Open picker';
        btn.addEventListener('click', e => {
            e.stopPropagation();
            // showPicker() not universally supported; .click() opens the native date/time UI in older browsers
            try { nativeInput.showPicker(); } catch { nativeInput.click(); }
        });
        spinner.appendChild(btn);
    }

    function _buildTimeSpinner(opts) {
        const content = _buildContent('fs-spinner-panel');
        const step = opts.step || 60;
        const showSec = step < 60;
        const showArrows = opts.showArrows !== false;
        const showPicker = opts.showPicker !== undefined ? opts.showPicker : _isTouchDevice();
        const allowTyping = opts.allowTyping !== false;

        const t = _parseTime(opts.value || '00:00');
        const spinner = document.createElement('div');
        spinner.className = 'fs-spinner';
        spinner.dataset.inputType = 'time';
        _addSpinnerCol(spinner, 'h', t.h, 0, 23, 1, false, showArrows, allowTyping);
        _addSpinnerSep(spinner, ':');
        _addSpinnerCol(spinner, 'm', t.m, 0, 59, step >= 60 ? Math.round(step / 60) : 1, false, showArrows, allowTyping);
        if (showSec) {
            _addSpinnerSep(spinner, ':');
            _addSpinnerCol(spinner, 's', t.s, 0, 59, step, false, showArrows, allowTyping);
        }
        const nativeInput = _addNativePickerInput(content, 'time', 'fs-time-input', opts);
        if (showPicker) _addPickerBtn(spinner, nativeInput, '⏰');
        content.appendChild(spinner);
        return content;
    }

    function _buildDateSpinner(opts) {
        const content = _buildContent('fs-spinner-panel');
        const showArrows = opts.showArrows !== false;
        const showPicker = opts.showPicker !== false;
        const allowTyping = opts.allowTyping !== false;

        const dt = _parseDate(opts.value);
        const spinner = document.createElement('div');
        spinner.className = 'fs-spinner';
        spinner.dataset.inputType = 'date';
        _addSpinnerCol(spinner, 'y', dt.y, 1900, 2100, 1, true, showArrows, allowTyping);
        _addSpinnerSep(spinner, '-');
        _addSpinnerCol(spinner, 'mo', dt.mo, 1, 12, 1, false, showArrows, allowTyping);
        _addSpinnerSep(spinner, '-');
        _addSpinnerCol(spinner, 'd', dt.d, 1, 31, 1, false, showArrows, allowTyping);
        const nativeInput = _addNativePickerInput(content, 'date', 'fs-date-input', opts);
        if (showPicker) _addPickerBtn(spinner, nativeInput, '📅');
        content.appendChild(spinner);
        return content;
    }

    function _buildDatetimeSpinner(opts) {
        const content = _buildContent('fs-spinner-panel');
        const showArrows = opts.showArrows !== false;
        const showPicker = opts.showPicker !== false;
        const allowTyping = opts.allowTyping !== false;
        const step = opts.step || 60;
        const showSec = step < 60;

        const [dp, tp] = (opts.value || '').split('T');
        const dt = _parseDate(dp);
        const t = _parseTime(tp || '00:00');

        const spinner = document.createElement('div');
        spinner.className = 'fs-spinner';
        spinner.dataset.inputType = 'datetime';
        spinner.style.flexWrap = 'wrap';
        spinner.style.rowGap = '6px';

        _addSpinnerCol(spinner, 'y', dt.y, 1900, 2100, 1, true, showArrows, allowTyping);
        _addSpinnerSep(spinner, '-');
        _addSpinnerCol(spinner, 'mo', dt.mo, 1, 12, 1, false, showArrows, allowTyping);
        _addSpinnerSep(spinner, '-');
        _addSpinnerCol(spinner, 'd', dt.d, 1, 31, 1, false, showArrows, allowTyping);

        const spacer = document.createElement('div');
        spacer.style.cssText = 'width:8px;align-self:center;height:1px;background:rgba(255,255,255,0.12);';
        spinner.appendChild(spacer);

        _addSpinnerCol(spinner, 'h', t.h, 0, 23, 1, false, showArrows, allowTyping);
        _addSpinnerSep(spinner, ':');
        _addSpinnerCol(spinner, 'm', t.m, 0, 59, step >= 60 ? Math.round(step / 60) : 1, false, showArrows, allowTyping);
        if (showSec) {
            _addSpinnerSep(spinner, ':');
            _addSpinnerCol(spinner, 's', t.s, 0, 59, step, false, showArrows, allowTyping);
        }
        const nativeInput = _addNativePickerInput(content, 'datetime-local', 'fs-datetime-input', opts);
        if (showPicker) _addPickerBtn(spinner, nativeInput, '📅');
        content.appendChild(spinner);
        return content;
    }

    function _segVal(el) { return el ? (parseInt(el.value ?? el.textContent) || 0) : 0; }

    function _spinnerTimeSync(instance) {
        const get = seg => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${seg}"]`));
        const showSec = !!instance.el.querySelector('.fs-spinner-val[data-seg="s"]');
        const val = _formatTime(get('h'), get('m'), get('s'), showSec);
        for (const inp of instance.el.querySelectorAll('.fs-time-input')) inp.value = val;
        if (instance.opts.onChange !== false) instance.emit('change', { value: val });
    }

    function _spinnerDateSync(instance) {
        const get = seg => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${seg}"]`));
        const val = _formatDate(get('y'), get('mo'), get('d'));
        for (const inp of instance.el.querySelectorAll('.fs-date-input')) inp.value = val;
        if (instance.opts.onChange !== false) instance.emit('change', { value: val });
    }

    function _spinnerDatetimeSync(instance) {
        const get = seg => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${seg}"]`));
        const showSec = !!instance.el.querySelector('.fs-spinner-val[data-seg="s"]');
        const val = `${_formatDate(get('y'), get('mo'), get('d'))}T${_formatTime(get('h'), get('m'), get('s'), showSec)}`;
        for (const inp of instance.el.querySelectorAll('.fs-datetime-input')) inp.value = val;
        if (instance.opts.onChange !== false) instance.emit('change', { value: val });
    }

    function _spinnerTimeClick(instance, e) {
        const btn = e.target.closest('.fs-spinner-btn[data-dir]');
        if (!btn) return false;
        const col = btn.closest('.fs-spinner-col');
        if (!col) return false;
        const seg = col.dataset.seg;
        const step = parseFloat(col.dataset.step) || 1;
        const dir = btn.dataset.dir === 'up' ? 1 : -1;
        const valEl = col.querySelector('.fs-spinner-val');
        if (!valEl) return false;
        if (seg === 'h') {
            valEl.value = String((parseInt(valEl.value) + dir + 24) % 24).padStart(2, '0');
        } else {
            valEl.value = String(((parseInt(valEl.value) || 0) + dir * step + 60) % 60).padStart(2, '0');
        }
        return true;
    }

    function _spinnerDateClick(instance, e) {
        const btn = e.target.closest('.fs-spinner-btn[data-dir]');
        if (!btn) return false;
        const col = btn.closest('.fs-spinner-col');
        if (!col) return false;
        const seg = col.dataset.seg;
        const dir = btn.dataset.dir === 'up' ? 1 : -1;
        const valEl = col.querySelector('.fs-spinner-val');
        if (!valEl) return false;

        const getV = s => { const e2 = instance.el.querySelector(`.fs-spinner-val[data-seg="${s}"]`); return e2 ? (parseInt(e2.value) || 0) : 0; };
        const setV = (s, v, yr) => { const e2 = instance.el.querySelector(`.fs-spinner-val[data-seg="${s}"]`); if (e2) e2.value = String(v).padStart(yr ? 4 : 2, '0'); };

        let y = getV('y'), mo = getV('mo'), d = getV('d');

        if (seg === 'y') {
            y = Math.max(1900, Math.min(2100, y + dir));
        } else if (seg === 'mo') {
            mo += dir;
            if (mo < 1) { mo = 12; y = Math.max(1900, y - 1); }
            if (mo > 12) { mo = 1; y = Math.min(2100, y + 1); }
        } else {
            d += dir;
            const maxD = _daysInMonth(y, mo);
            if (d < 1) d = maxD;
            if (d > maxD) d = 1;
        }
        d = Math.min(d, _daysInMonth(y, mo));
        setV('y', y, true); setV('mo', mo); setV('d', d);
        return true;
    }

    function _setSpinnerFromValue(el, inputType, value) {
        if (!value) return;
        const set = (seg, v, yr) => { const e = el.querySelector(`.fs-spinner-val[data-seg="${seg}"]`); if (e) e.value = String(v).padStart(yr ? 4 : 2, '0'); };
        if (inputType === 'time') {
            const t = _parseTime(value);
            set('h', t.h); set('m', t.m); set('s', t.s);
        } else if (inputType === 'date') {
            const dt = _parseDate(value);
            set('y', dt.y, true); set('mo', dt.mo); set('d', dt.d);
        } else if (inputType === 'datetime') {
            const [dp, tp] = value.split('T');
            _setSpinnerFromValue(el, 'date', dp);
            _setSpinnerFromValue(el, 'time', tp);
        }
    }

    function _wireNativeToSpinner(instance, inputSel, syncFn, inputType) {
        const input = instance.el.querySelector(inputSel);
        if (!input) return;
        input.addEventListener('change', () => {
            if (input.value) _setSpinnerFromValue(instance.el, inputType, input.value);
            if (instance.opts.onChange !== false) instance.emit('change', { value: input.value });
        });
    }

    function _wireSpinnerTyping(instance, syncFn) {
        for (const inp of instance.el.querySelectorAll('.fs-spinner-val:not([readonly])')) {
            inp.addEventListener('focus', () => inp.select());
            // Re-select on click so the user can type immediately (browser overrides select() from focus with cursor position on mouseup)
            inp.addEventListener('click', e => { e.stopPropagation(); inp.select(); });
            inp.addEventListener('input', () => {
                inp.value = inp.value.replace(/\D/g, '').slice(0, inp.classList.contains('fs-spinner-year') ? 4 : 2);
            });
            inp.addEventListener('blur', () => {
                const col = inp.closest('.fs-spinner-col');
                if (!col) return;
                const min = parseFloat(col.dataset.min);
                const max = parseFloat(col.dataset.max);
                const isYear = inp.classList.contains('fs-spinner-year');
                let v = parseInt(inp.value);
                if (isNaN(v)) v = min;
                v = Math.max(min, Math.min(max, v));
                inp.value = String(v).padStart(isYear ? 4 : 2, '0');
                syncFn(instance);
            });
        }
    }

    function _isTouchDevice() {
        return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    }

    function _log(level, msg, data) {
        if (!_logger) return;
        if (_loggerFilter) {
            if (typeof _loggerFilter === 'function') { if (!_loggerFilter(level, msg, data)) return; }
            else if (Array.isArray(_loggerFilter)) { if (!_loggerFilter.includes(level)) return; }
            else if (_loggerFilter !== level) return;
        }
        _logger(level, msg, data);
    }

    // Skips parent floaters (those whose el contains the anchor of the clicked floater).
    function _closeOnClickOutside(excludeInst) {
        const anchor = excludeInst._openAnchor;
        for (const other of _registry.values()) {
            if (other === excludeInst || !other.isOpen) continue;
            if (other.opts.modal || other.opts.persistOnOutsideClick || other.opts.protected || other.opts.closeOnOutsideClick === false) continue;
            if (other.opts.closeOnFloaterClick === false) continue;
            if (anchor && typeof anchor.contains === 'function' && other.el.contains(anchor)) continue;
            const typeDef = _types[other.type];
            if (typeDef && typeDef.onClickOutside) typeDef.onClickOutside(other);
            else other.close();
        }
    }

    function _matchesFilter(instance, filter) {
        if (!filter) return true;
        if (typeof filter === 'function') return filter(instance);
        if (typeof filter === 'string') return instance.type === filter;
        if (filter.type && instance.type !== filter.type) return false;
        if (filter.id && instance.id !== filter.id) return false;
        if (filter.idPrefix && !instance.id.startsWith(filter.idPrefix)) return false;
        if (filter.open !== undefined && instance.isOpen !== filter.open) return false;
        return true;
    }

    class FloaterInstance {
        constructor(id, el, type, opts) {
            this._id = id;
            this._el = el;
            this._type = type;
            this._opts = opts || {};
            this._isOpen = false;
            this._handlers = {};
            this._cleanups = [];
            this._scrollCleanup = null;
            this._attached = false;
            this._originalParent = null;
            this._originalNextSibling = null;
            this._currentArrowEl = null;
            this._openAnchor = null;
            this._openOpts = null;
            this._blockingScroll = false;
            this._animCancel = null;
        }

        get id() { return this._id; }
        get el() { return this._el; }
        get type() { return this._type; }
        get isOpen() { return this._isOpen; }
        get opts() { return this._opts; }

        on(event, fn) {
            if (!this._handlers[event]) this._handlers[event] = [];
            this._handlers[event].push(fn);
            return this;
        }

        off(event, fn) {
            if (!this._handlers[event]) return this;
            this._handlers[event] = this._handlers[event].filter(h => h !== fn);
            return this;
        }

        emit(event, data) {
            const payload = Object.assign({ id: this._id, type: this._type, opts: this._opts, trigger: 'programmatic' }, data);
            for (const fn of (this._handlers[event] || [])) fn(payload, this);
            for (const fn of (_globalHandlers[event] || [])) fn(this, payload);
            _log('event', `${this._id}:${event}`, { data: payload, instance: this });
            return this;
        }

        open(anchor, openOpts) {
            const merged = Object.assign({}, this._opts, openOpts);
            if (merged.arrowEl) this._currentArrowEl = merged.arrowEl;
            this._openAnchor = anchor;
            this._openOpts = merged;
            const trigger = merged.trigger || 'programmatic';
            this.emit('trigger', { anchor, trigger });
            const typeDef = _types[this._type];
            if (typeDef && typeDef.onOpen) {
                if (typeDef.onOpen(this, anchor, merged) === false) return this;
            }
            if (merged.closeOthers !== false) {
                for (const other of _registry.values()) {
                    if (other === this || !other.isOpen) continue;
                    if (other.opts.protected || other.opts.modal) continue;
                    if ((_types[other.type] && _types[other.type].closeOthersImmune) || other.opts.closeOthersImmune) continue;
                    other.close();
                }
            }
            const cont = _getContainer();
            if (this._attached) {
                this._originalParent = this._el.parentNode;
                this._originalNextSibling = this._el.nextSibling;
                cont.appendChild(this._el);
            }
            // Bring to front before measuring so the element is in its final DOM position when shown
            if (cont.contains(this._el)) cont.appendChild(this._el);
            const zBoost = (_types[this._type] && _types[this._type].zPriority) || 0;
            this._el.style.zIndex = String(++_zCounter + zBoost);
            _position(anchor, this._el, merged);
            this._isOpen = true;
            _openCount++;

            if (merged.modal) { _getBackdrop(); _updateBackdropState(); }
            if (merged.blockScroll && !this._blockingScroll) {
                this._blockingScroll = true;
                if (!_scrollBlockCount) document.body.style.overflow = 'hidden';
                _scrollBlockCount++;
            }

            // modal and protected are always scroll-immune (static)
            // closeOnScroll: false (default) → follows anchor on scroll (repositions)
            // closeOnScroll: true → closes on scroll
            const scrollImmune = merged.modal || merged.protected;
            if (this._scrollCleanup) this._scrollCleanup();
            if (!scrollImmune) {
                const scrollTargets = _getScrollAncestors(anchor);
                if (merged.closeOnScroll === true) {
                    const onScroll = () => { if (this._isOpen) this.close({ trigger: 'scroll-reposition' }); };
                    for (const target of scrollTargets) target.addEventListener('scroll', onScroll, { passive: true, once: true });
                    this._scrollCleanup = () => { for (const target of scrollTargets) target.removeEventListener('scroll', onScroll); };
                } else if (anchor && typeof anchor.getBoundingClientRect === 'function') {
                    const openRect = anchor.getBoundingClientRect();
                    const openScrolls = scrollTargets.map(t => t === window ? window.scrollY : t.scrollTop);
                    const onScroll = () => {
                        if (!this._isOpen) return;
                        if (this._openAnchor.isConnected) {
                            _position(this._openAnchor, this._el, this._openOpts || {});
                            return;
                        }
                        let vertDelta = 0;
                        scrollTargets.forEach((t, i) => {
                            vertDelta += (t === window ? window.scrollY : t.scrollTop) - openScrolls[i];
                        });
                        _position({
                            getBoundingClientRect: () => ({
                                top: openRect.top - vertDelta, bottom: openRect.bottom - vertDelta,
                                left: openRect.left, right: openRect.right,
                                width: openRect.width, height: openRect.height,
                            }),
                        }, this._el, this._openOpts || {});
                    };
                    for (const target of scrollTargets) target.addEventListener('scroll', onScroll, { passive: true });
                    this._scrollCleanup = () => { for (const target of scrollTargets) target.removeEventListener('scroll', onScroll); };
                }
            }

            _updateFocusClasses();
            this.emit('show', { anchor, opts: merged, trigger });
            if (this._animCancel) { this._animCancel(); this._animCancel = null; }
            const inAnim = _effectiveAnim(_resolveAnim(merged.animateIn), merged, 'in');
            if (inAnim) {
                this._animCancel = _animate(this._el, inAnim, 'in', () => {
                    this._animCancel = null;
                    this.emit('shown', { trigger });
                });
            } else {
                this.emit('shown', { trigger });
            }
            return this;
        }

        close(closeOpts) {
            if (!this._isOpen) return this;
            const merged = Object.assign({}, this._opts, closeOpts);
            const trigger = merged.trigger || 'programmatic';
            const typeDef = _types[this._type];
            if (typeDef && typeDef.onClose) typeDef.onClose(this, merged);
            this._isOpen = false;
            if (_openCount > 0) _openCount--;
            if (this._scrollCleanup) { this._scrollCleanup(); this._scrollCleanup = null; }
            if (this._blockingScroll) {
                this._blockingScroll = false;
                if (_scrollBlockCount > 0) _scrollBlockCount--;
                if (!_scrollBlockCount) document.body.style.overflow = '';
            }
            if (this._opts.modal) _updateBackdropState();
            _updateFocusClasses();

            const finish = () => {
                _unposition(this._el, merged.arrowEl || this._currentArrowEl || null);
                this._currentArrowEl = null;
                if (this._attached && this._originalParent) {
                    if (this._originalNextSibling && this._originalNextSibling.parentNode === this._originalParent) {
                        this._originalParent.insertBefore(this._el, this._originalNextSibling);
                    } else {
                        this._originalParent.appendChild(this._el);
                    }
                    this._originalParent = null;
                    this._originalNextSibling = null;
                }
                this.emit('hidden', { trigger });
            };

            if (this._animCancel) { this._animCancel(); this._animCancel = null; }
            this.emit('hide', { opts: merged, trigger });
            const outAnim = _effectiveAnim(_resolveAnim(merged.animateOut), merged, 'out');
            if (outAnim) {
                this._animCancel = _animate(this._el, outAnim, 'out', () => {
                    this._animCancel = null;
                    finish();
                });
            } else {
                finish();
            }
            return this;
        }

        toggle(anchor, toggleOpts) {
            return this._isOpen ? this.close(toggleOpts) : this.open(anchor, toggleOpts);
        }

        update(updateOpts) {
            Object.assign(this._opts, updateOpts);
            const typeDef = _types[this._type];
            if (typeDef && typeDef.onUpdate) typeDef.onUpdate(this, updateOpts);
            if (updateOpts.currentValue !== undefined || updateOpts.preferenceValue !== undefined) {
                _applyMarkers(this._el, this._opts);
            }
            this.emit('update', updateOpts);
            return this;
        }

        destroy() {
            this.close();
            for (const fn of this._cleanups) fn();
            this._cleanups = [];
            _registry.delete(this._id);
            this.emit('destroy', {});
        }

        _addCleanup(fn) { this._cleanups.push(fn); }
    }

    document.addEventListener('click', () => {
        if (_openCount === 0) return;
        for (const instance of _registry.values()) {
            if (!instance.isOpen) continue;
            if (instance.opts.modal || instance.opts.persistOnOutsideClick || instance.opts.protected || instance.opts.closeOnOutsideClick === false) continue;
            const typeDef = _types[instance.type];
            if (typeDef && typeDef.onClickOutside) {
                typeDef.onClickOutside(instance);
            } else {
                instance.close();
            }
        }
    });

    document.addEventListener('keydown', e => {
        if (e.key !== 'Escape' || _openCount === 0) return;
        const open = [..._registry.values()].filter(i => i.isOpen && i.opts.closeOnEscape !== false && !i.opts.protected && !i.opts.modal);
        if (open.length === 0) return;
        open[open.length - 1].close();
    });

    // On visual viewport resize (mobile keyboard): close only floaters whose anchor would be hidden
    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            if (_openCount === 0) return;
            const vH = window.visualViewport.height;
            for (const inst of _registry.values()) {
                if (!inst.isOpen) continue;
                // Don't close if focus is inside this floater (e.g. mobile keyboard opened from a text input)
                if (inst.el.contains(document.activeElement)) continue;
                const anchor = inst._openAnchor;
                if (anchor && typeof anchor.getBoundingClientRect === 'function') {
                    if (anchor.getBoundingClientRect().bottom <= vH) continue;
                }
                inst.close();
            }
        });
    }

    function _closeOnOutside(instance) { instance.close(); }

    function _buildContent(baseClass) {
        const content = document.createElement('div');
        content.className = baseClass;
        return content;
    }

    function _wrapContent(content, opts) {
        content.classList.add('fs-floater-content');
        if (opts.className) content.classList.add(...opts.className.split(' ').filter(Boolean));
        const wrapper = document.createElement('div');
        wrapper.className = 'fs-floater';
        if (opts.id) wrapper.id = opts.id;
        wrapper.appendChild(content);
        if (opts.noContextMenu) wrapper.dataset.fsNoContextMenu = '1';
        return wrapper;
    }

    function _content(el) {
        return el.querySelector('.fs-floater-content');
    }

    function _buildDropdownOption(item) {
        const opt = document.createElement('div');
        opt.className = 'fs-dropdown-option' + (item.selected ? ' fs-opt-selected' : '');
        opt.dataset.value = item.value;
        opt.textContent = item.label;
        return opt;
    }

    function _buildPickerPreset(v) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'fs-number-picker-preset';
        btn.dataset.value = v;
        btn.textContent = v;
        return btn;
    }

    function _buildSuggestionItem(s) {
        const item = document.createElement('div');
        item.className = 'fs-text-suggestion';
        item.dataset.value = s.value != null ? s.value : s;
        item.textContent = s.label != null ? s.label : s;
        return item;
    }

    _types['dropdown'] = {
        build(opts) {
            const content = _buildContent('fs-dropdown');
            if (opts.items) for (const item of opts.items) content.appendChild(_buildDropdownOption(item));
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => {
                const opt = e.target.closest('.fs-dropdown-option');
                if (!opt) return;
                if (instance.opts.onChange !== false) instance.emit('change', { value: opt.dataset.value, label: opt.textContent.trim(), el: opt });
                instance.close();
            });
        },
        onUpdate(instance, opts) {
            if (!opts.items) return;
            const content = _content(instance.el);
            content.innerHTML = '';
            for (const item of opts.items) content.appendChild(_buildDropdownOption(item));
            _applyMarkers(instance.el, instance.opts);
        },
        onScrollSelect(instance, delta) {
            const items = instance.opts.items;
            if (!items || !items.length) return;
            const cur = String(instance.opts.currentValue ?? '');
            let idx = items.findIndex(i => String(i.value) === cur);
            if (idx < 0) idx = delta > 0 ? -1 : 0;
            idx = Math.max(0, Math.min(items.length - 1, idx + delta));
            const item = items[idx];
            instance.emit('change', { value: item.value, label: item.label, el: null });
            instance.update({ currentValue: item.value });
        },
        onClickOutside: _closeOnOutside,
    };

    _types['number-picker'] = {
        build(opts) {
            const content = _buildContent('fs-number-picker');
            if (opts.presets) for (const v of opts.presets) content.appendChild(_buildPickerPreset(v));
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('mousedown', e => {
                const preset = e.target.closest('.fs-number-picker-preset');
                if (!preset) return;
                // preventDefault keeps focus on the anchor (e.g. a number input) so blur doesn't fire before the value commits
                e.preventDefault();
                if (instance.opts.onChange !== false) instance.emit('change', { value: preset.dataset.value, label: preset.textContent.trim(), el: preset });
                instance.close();
            });
        },
        onUpdate(instance, opts) {
            if (!opts.presets) return;
            const content = _content(instance.el);
            content.innerHTML = '';
            for (const v of opts.presets) content.appendChild(_buildPickerPreset(v));
            _applyMarkers(instance.el, instance.opts);
        },
        onScrollSelect(instance, delta) {
            const presets = instance.opts.presets;
            const mode = instance.opts.scrollMode || (presets?.length ? 'presets' : 'step');
            if (mode === 'presets' && presets?.length) {
                const cur = String(instance.opts.currentValue ?? '');
                let idx = presets.findIndex(v => String(v) === cur);
                if (idx < 0) idx = delta > 0 ? -1 : 0;
                idx = Math.max(0, Math.min(presets.length - 1, idx + delta));
                instance.emit('change', { value: presets[idx] });
                instance.update({ currentValue: presets[idx] });
            } else {
                const step = instance.opts.step ?? 1;
                const min = instance.opts.min ?? null;
                const max = instance.opts.max ?? null;
                let val = parseFloat(instance.opts.currentValue ?? 0) - delta * step;
                if (min != null) val = Math.max(min, val);
                if (max != null) val = Math.min(max, val);
                instance.emit('change', { value: val });
                instance.update({ currentValue: val });
            }
        },
        onClickOutside: _closeOnOutside,
    };

    _types['text-suggestions'] = {
        build(opts) {
            const content = _buildContent('fs-text-suggestions');
            if (opts.suggestions) for (const s of opts.suggestions) content.appendChild(_buildSuggestionItem(s));
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => {
                const item = e.target.closest('.fs-text-suggestion');
                if (!item) return;
                if (instance.opts.onChange !== false) instance.emit('change', { value: item.dataset.value, label: item.textContent.trim(), el: item });
                instance.close();
            });
        },
        onUpdate(instance, opts) {
            if (!opts.suggestions) return;
            const content = _content(instance.el);
            content.innerHTML = '';
            for (const s of opts.suggestions) content.appendChild(_buildSuggestionItem(s));
            _applyMarkers(instance.el, instance.opts);
        },
        onClickOutside: _closeOnOutside,
    };

    _types['popover'] = {
        build(opts) {
            const content = _buildContent('fs-popover');
            if (opts.content != null) content.innerHTML = opts.content;
            return content;
        },
        init(instance) { instance.el.addEventListener('click', e => e.stopPropagation()); },
        onUpdate(instance, opts) { if (opts.content != null) _content(instance.el).innerHTML = opts.content; },
        onClickOutside: _closeOnOutside,
    };

    function _buildChip(item, selected, preferred) {
        const chip = document.createElement('div');
        chip.className = 'fs-chip'
            + (selected.has(String(item.value)) ? ' fs-chip-selected' : '')
            + (preferred.has(String(item.value)) ? ' fs-chip-preferred' : '');
        chip.dataset.value = item.value;
        chip.textContent = item.label;
        return chip;
    }

    _types['chips'] = {
        build(opts) {
            const content = _buildContent('fs-chips');
            const selected = new Set((opts.selectedValues || []).map(String));
            const preferred = new Set((opts.preferenceValues || []).map(String));
            for (const item of (opts.items || [])) content.appendChild(_buildChip(item, selected, preferred));
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => {
                const chip = e.target.closest('.fs-chip');
                if (!chip) return;
                const max = instance.opts.maxSelect;
                if (!chip.classList.contains('fs-chip-selected') && max != null) {
                    if (instance.el.querySelectorAll('.fs-chip-selected').length >= max) return;
                }
                chip.classList.toggle('fs-chip-selected');
                const selected = [...instance.el.querySelectorAll('.fs-chip-selected')].map(c => c.dataset.value);
                if (instance.opts.onChange !== false) instance.emit('change', { value: chip.dataset.value, selected, toggled: chip.classList.contains('fs-chip-selected'), el: chip });
                if (instance.opts.closeOnMax && max != null && selected.length >= max) instance.close();
            });
        },
        onUpdate(instance, opts) {
            if (opts.preferenceValues) {
                const pref = new Set(opts.preferenceValues.map(String));
                for (const c of instance.el.querySelectorAll('.fs-chip')) c.classList.toggle('fs-chip-preferred', pref.has(c.dataset.value));
            }
            if (opts.selectedValues) {
                const sel = new Set(opts.selectedValues.map(String));
                for (const c of instance.el.querySelectorAll('.fs-chip')) c.classList.toggle('fs-chip-selected', sel.has(c.dataset.value));
            }
            if (opts.items) {
                const prev = new Set([...instance.el.querySelectorAll('.fs-chip-selected')].map(c => c.dataset.value));
                const pref = new Set((opts.preferenceValues || instance.opts.preferenceValues || []).map(String));
                const content = _content(instance.el);
                content.innerHTML = '';
                for (const item of opts.items) {
                    content.appendChild(_buildChip(item, prev, pref));
                }
            }
        },
        onClickOutside: _closeOnOutside,
    };

    _types['slider'] = {
        build(opts) {
            const content = _buildContent('fs-slider-panel');
            for (const s of (opts.sliders || [])) {
                const row = document.createElement('div');
                row.className = 'fs-slider-row';
                const header = document.createElement('div');
                header.className = 'fs-slider-header';
                if (s.label) {
                    const lbl = document.createElement('span');
                    lbl.className = 'fs-slider-label';
                    lbl.textContent = s.label;
                    header.appendChild(lbl);
                }
                const valDisplay = document.createElement('span');
                valDisplay.className = 'fs-slider-value';
                valDisplay.textContent = s.value ?? s.min ?? 0;
                header.appendChild(valDisplay);
                const input = document.createElement('input');
                input.type = 'range';
                input.className = 'fs-slider-input';
                if (s.name) input.dataset.name = s.name;
                input.min = s.min ?? 0;
                input.max = s.max ?? 100;
                input.step = s.step ?? 1;
                input.value = s.value ?? s.min ?? 0;
                row.appendChild(header);
                row.appendChild(input);
                content.appendChild(row);
            }
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('input', e => {
                const input = e.target.closest('.fs-slider-input');
                if (!input) return;
                const valDisplay = input.closest('.fs-slider-row')?.querySelector('.fs-slider-value');
                if (valDisplay) valDisplay.textContent = input.value;
                if (instance.opts.onChange !== false) instance.emit('change', { name: input.dataset.name || null, value: input.value, el: input });
            });
        },
        onUpdate(instance, opts) {
            if (!opts.sliders) return;
            for (const s of opts.sliders) {
                if (!s.name || s.value == null) continue;
                const input = instance.el.querySelector(`.fs-slider-input[data-name="${s.name}"]`);
                if (!input) continue;
                input.value = s.value;
                const valDisplay = input.closest('.fs-slider-row')?.querySelector('.fs-slider-value');
                if (valDisplay) valDisplay.textContent = s.value;
                if (instance.opts.onChange !== false) instance.emit('change', { name: s.name, value: String(s.value) });
            }
        },
        onClickOutside: _closeOnOutside,
    };

    // Minimal FloaterInstance proxy for sub-types nested inside input-group; routes their emitted events through the parent instance.
    function _makeSubProxy(parentInstance, field) {
        return {
            el: null,
            opts: Object.assign({}, field),
            isOpen: true,
            close() {},
            on() { return this; },
            off() { return this; },
            emit(event, data) {
                if (parentInstance.opts.onChange !== false) {
                    parentInstance.emit(event, Object.assign({ name: field.name, subType: field.type }, data));
                }
            },
        };
    }

    function _buildInputRow(field) {
        const row = document.createElement('div');
        row.className = 'fs-input-row';

        if (field.type === 'checkbox') {
            const lbl = document.createElement('label');
            lbl.className = 'fs-input-checkbox-row';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 'fs-input-checkbox';
            if (field.name) chk.dataset.name = field.name;
            if (field.checked) chk.checked = true;
            const span = document.createElement('span');
            span.textContent = field.label || '';
            lbl.appendChild(chk);
            lbl.appendChild(span);
            row.appendChild(lbl);
            return row;
        }

        if (field.type && _types[field.type]) {
            if (field.label) {
                const lbl = document.createElement('label');
                lbl.className = 'fs-input-label';
                lbl.textContent = field.label;
                row.appendChild(lbl);
            }
            const subEl = _types[field.type].build(Object.assign({}, field));
            subEl.classList.add('fs-floater-content');
            subEl.dataset.fsSubtype = field.type;
            if (field.name) subEl.dataset.fsName = field.name;
            subEl._fsField = field;
            row.appendChild(subEl);
            return row;
        }

        if (field.label) {
            const lbl = document.createElement('label');
            lbl.className = 'fs-input-label';
            lbl.textContent = field.label;
            row.appendChild(lbl);
        }

        let input;
        if (field.type === 'select') {
            input = document.createElement('select');
            input.className = 'fs-input-field';
            for (const opt of (field.options || [])) {
                const o = document.createElement('option');
                o.value = opt.value ?? opt;
                o.textContent = opt.label ?? opt;
                if (String(opt.value ?? opt) === String(field.value)) o.selected = true;
                input.appendChild(o);
            }
        } else if (field.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'fs-input-field';
            input.rows = field.rows || 3;
            if (field.value != null) input.value = field.value;
        } else {
            input = document.createElement('input');
            input.type = field.type || 'text';
            input.className = 'fs-input-field';
            if (field.value != null) input.value = field.value;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.min != null) input.min = field.min;
            if (field.max != null) input.max = field.max;
            if (field.step != null) input.step = field.step;
        }
        if (field.name) input.dataset.name = field.name;
        row.appendChild(input);
        return row;
    }

    _types['input-group'] = {
        build(opts) {
            const content = _buildContent('fs-input-group');
            for (const field of (opts.inputs || [])) content.appendChild(_buildInputRow(field));
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            for (const subEl of instance.el.querySelectorAll('[data-fs-subtype]')) {
                const type = subEl.dataset.fsSubtype;
                const field = subEl._fsField;
                if (!field || !_types[type]) continue;
                const sub = _makeSubProxy(instance, field);
                sub.el = subEl;
                subEl._fsSubInstance = sub;
                if (_types[type].init) _types[type].init(sub, field);
                if (field.currentValue != null || field.preferenceValue != null) _applyMarkers(subEl, field);
                if (type === 'dropdown') {
                    subEl.addEventListener('click', e => {
                        const opt = e.target.closest('.fs-dropdown-option');
                        if (!opt) return;
                        field.currentValue = opt.dataset.value;
                        _applyMarkers(subEl, field);
                    });
                }
            }
            instance.el.addEventListener('change', e => {
                if (e.target.closest('[data-fs-subtype]') || instance.opts.onChange === false) return;
                const el = e.target.closest('[data-name]');
                if (!el) return;
                instance.emit('change', { name: el.dataset.name, value: el.type === 'checkbox' ? el.checked : el.value, type: el.type, el });
            });
            instance.el.addEventListener('input', e => {
                if (e.target.closest('[data-fs-subtype]') || instance.opts.onChange === false) return;
                const el = e.target.closest('[data-name]');
                if (!el) return;
                if (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'number' || el.type === 'range') {
                    instance.emit('input', { name: el.dataset.name, value: el.value, type: el.type, el });
                }
            });
        },
        onUpdate(instance, opts) {
            if (!opts.inputs) return;
            for (const field of opts.inputs) {
                if (!field.name) continue;
                const subEl = instance.el.querySelector(`[data-fs-subtype][data-fs-name="${field.name}"]`);
                if (subEl) {
                    const type = subEl.dataset.fsSubtype;
                    const sub = subEl._fsSubInstance;
                    if (sub && _types[type]?.onUpdate) { Object.assign(sub.opts, field); _types[type].onUpdate(sub, field); }
                    continue;
                }
                const el = instance.el.querySelector(`[data-name="${field.name}"]`);
                if (!el || field.value == null) continue;
                if (el.type === 'checkbox') el.checked = !!field.value;
                else el.value = field.value;
                if (instance.opts.onChange !== false) instance.emit('change', { name: field.name, value: field.value });
            }
        },
        onClickOutside: _closeOnOutside,
    };

    _types['date'] = {
        build: opts => _buildDateSpinner(opts),
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => { if (_spinnerDateClick(instance, e)) _spinnerDateSync(instance); });
            _wireNativeToSpinner(instance, '.fs-date-input', _spinnerDateSync, 'date');
            _wireSpinnerTyping(instance, _spinnerDateSync);
        },
        onUpdate(instance, opts) {
            if (opts.value == null) return;
            for (const inp of instance.el.querySelectorAll('.fs-date-input')) inp.value = opts.value;
            _setSpinnerFromValue(instance.el, 'date', opts.value);
            if (instance.opts.onChange !== false) instance.emit('change', { value: opts.value });
        },
        onScrollSelect(instance, delta, e) {
            const col = e?.target?.closest?.('.fs-spinner-col[data-seg]');
            const onFloater = instance.el.contains(e?.target);
            if (onFloater && col && instance.opts.scrollCols === false) return;
            if (onFloater && !col && !instance.opts.scrollPanel) return;
            const seg = (col && ['y', 'mo', 'd'].includes(col.dataset.seg)) ? col.dataset.seg : 'd';
            const getV = s => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${s}"]`));
            const dt = instance.isOpen
                ? { y: getV('y'), mo: getV('mo'), d: getV('d') }
                : _parseDate(instance.opts.value || '');
            if (seg === 'y') {
                dt.y = Math.max(1900, Math.min(2100, dt.y - delta));
            } else if (seg === 'mo') {
                dt.mo -= delta;
                if (dt.mo < 1) { dt.mo = 12; dt.y = Math.max(1900, dt.y - 1); }
                else if (dt.mo > 12) { dt.mo = 1; dt.y = Math.min(2100, dt.y + 1); }
            } else {
                dt.d -= delta;
                const maxD = _daysInMonth(dt.y, dt.mo);
                if (dt.d < 1) { dt.mo--; if (dt.mo < 1) { dt.mo = 12; dt.y--; } dt.d = _daysInMonth(dt.y, dt.mo); }
                else if (dt.d > maxD) { dt.mo++; if (dt.mo > 12) { dt.mo = 1; dt.y++; } dt.d = 1; }
            }
            dt.d = Math.min(dt.d, _daysInMonth(dt.y, dt.mo));
            const val = _formatDate(dt.y, dt.mo, dt.d);
            instance.update({ value: val });
            if (instance.opts.onChange !== false) instance.emit('change', { value: val });
        },
        onClickOutside: _closeOnOutside,
    };

    _types['time'] = {
        build: opts => _buildTimeSpinner(opts),
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => { if (_spinnerTimeClick(instance, e)) _spinnerTimeSync(instance); });
            _wireNativeToSpinner(instance, '.fs-time-input', _spinnerTimeSync, 'time');
            _wireSpinnerTyping(instance, _spinnerTimeSync);
        },
        onUpdate(instance, opts) {
            if (opts.value == null) return;
            for (const inp of instance.el.querySelectorAll('.fs-time-input')) inp.value = opts.value;
            _setSpinnerFromValue(instance.el, 'time', opts.value);
            if (instance.opts.onChange !== false) instance.emit('change', { value: opts.value });
        },
        onScrollSelect(instance, delta, e) {
            const col = e?.target?.closest?.('.fs-spinner-col[data-seg]');
            const onFloater = instance.el.contains(e?.target);
            if (onFloater && col && instance.opts.scrollCols === false) return;
            if (onFloater && !col && !instance.opts.scrollPanel) return;
            const showSec = !!instance.el.querySelector('.fs-spinner-val[data-seg="s"]');
            const seg = (col && ['h', 'm', 's'].includes(col.dataset.seg)) ? col.dataset.seg : (showSec ? 's' : 'm');
            const getV = s => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${s}"]`));
            const t = instance.isOpen
                ? { h: getV('h'), m: getV('m'), s: getV('s') }
                : _parseTime(instance.opts.value || '00:00');
            const step = Math.max(1, Math.round((instance.opts.step || 60) / 60));
            if (seg === 'h') {
                t.h = (t.h - delta + 24) % 24;
            } else if (seg === 'm') {
                t.m -= delta * step;
                while (t.m < 0) { t.m += 60; t.h = (t.h - 1 + 24) % 24; }
                while (t.m >= 60) { t.m -= 60; t.h = (t.h + 1) % 24; }
            } else {
                t.s = ((t.s || 0) - delta + 60) % 60;
            }
            const val = _formatTime(t.h, t.m, t.s, showSec);
            instance.update({ value: val });
            if (instance.opts.onChange !== false) instance.emit('change', { value: val });
        },
        onClickOutside: _closeOnOutside,
    };

    _types['datetime'] = {
        build: opts => _buildDatetimeSpinner(opts),
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => {
                const btn = e.target.closest('.fs-spinner-btn[data-dir]');
                if (!btn) return;
                const col = btn.closest('.fs-spinner-col');
                const seg = col?.dataset.seg;
                if (!seg) return;
                const isTime = seg === 'h' || seg === 'm' || seg === 's';
                if (isTime ? _spinnerTimeClick(instance, e) : _spinnerDateClick(instance, e)) {
                    _spinnerDatetimeSync(instance);
                }
            });
            _wireNativeToSpinner(instance, '.fs-datetime-input', _spinnerDatetimeSync, 'datetime');
            _wireSpinnerTyping(instance, _spinnerDatetimeSync);
        },
        onUpdate(instance, opts) {
            if (opts.value == null) return;
            for (const inp of instance.el.querySelectorAll('.fs-datetime-input')) inp.value = opts.value;
            _setSpinnerFromValue(instance.el, 'datetime', opts.value);
            if (instance.opts.onChange !== false) instance.emit('change', { value: opts.value });
        },
        onScrollSelect(instance, delta, e) {
            const col = e?.target?.closest?.('.fs-spinner-col[data-seg]');
            const onFloater = instance.el.contains(e?.target);
            if (onFloater && col && instance.opts.scrollCols === false) return;
            if (onFloater && !col && !instance.opts.scrollPanel) return;
            const showSec = !!instance.el.querySelector('.fs-spinner-val[data-seg="s"]');
            const seg = col ? col.dataset.seg : (showSec ? 's' : 'm');
            const getV = s => _segVal(instance.el.querySelector(`.fs-spinner-val[data-seg="${s}"]`));
            const parts = instance.isOpen ? [] : (instance.opts.value || '').split('T');
            const dt = instance.isOpen
                ? { y: getV('y'), mo: getV('mo'), d: getV('d') }
                : _parseDate(parts[0] || '');
            const t = instance.isOpen
                ? { h: getV('h'), m: getV('m'), s: getV('s') }
                : _parseTime(parts[1] || '00:00');
            const step = Math.max(1, Math.round((instance.opts.step || 60) / 60));
            if (seg === 'y') {
                dt.y = Math.max(1900, Math.min(2100, dt.y - delta));
            } else if (seg === 'mo') {
                dt.mo -= delta;
                if (dt.mo < 1) { dt.mo = 12; dt.y = Math.max(1900, dt.y - 1); }
                else if (dt.mo > 12) { dt.mo = 1; dt.y = Math.min(2100, dt.y + 1); }
            } else if (seg === 'd') {
                dt.d -= delta;
                const maxD = _daysInMonth(dt.y, dt.mo);
                if (dt.d < 1) { dt.mo--; if (dt.mo < 1) { dt.mo = 12; dt.y--; } dt.d = _daysInMonth(dt.y, dt.mo); }
                else if (dt.d > maxD) { dt.mo++; if (dt.mo > 12) { dt.mo = 1; dt.y++; } dt.d = 1; }
                dt.d = Math.min(dt.d, _daysInMonth(dt.y, dt.mo));
            } else if (seg === 'h') {
                t.h = (t.h - delta + 24) % 24;
            } else {
                t.m -= delta * step;
                while (t.m < 0) { t.m += 60; t.h = (t.h - 1 + 24) % 24; }
                while (t.m >= 60) { t.m -= 60; t.h = (t.h + 1) % 24; }
            }
            const val = `${_formatDate(dt.y, dt.mo, dt.d)}T${_formatTime(t.h, t.m, t.s, showSec)}`;
            instance.update({ value: val });
            if (instance.opts.onChange !== false) instance.emit('change', { value: val });
        },
        onClickOutside: _closeOnOutside,
    };

    _types['fetch'] = {
        build(opts) {
            const content = _buildContent('fs-fetch-panel');
            content.innerHTML = '<div class="fs-fetch-loading">Loading...</div>';
            return content;
        },
        init(instance) { instance.el.addEventListener('click', e => e.stopPropagation()); },
        onOpen(instance, anchor, opts) {
            const url = opts.url || instance.opts.url;
            if (!url) return;
            _content(instance.el).innerHTML = '<div class="fs-fetch-loading">Loading...</div>';
            const method = opts.fetchMethod || instance.opts.fetchMethod || 'fetch';
            const transform = opts.transform || instance.opts.transform || null;
            const respType = opts.responseType || instance.opts.responseType || 'auto';

            const extMatch = url.match(/\.([a-z0-9]+)(\?|$)/i);
            const ext = extMatch ? extMatch[1].toLowerCase() : '';
            const IMAGE_EXT = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'avif'];
            const VIDEO_EXT = ['mp4', 'webm', 'ogv', 'mov', 'avi'];
            const AUDIO_EXT = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'];
            const detectedMedia = respType !== 'auto' ? respType
                : IMAGE_EXT.includes(ext) ? 'image'
                    : VIDEO_EXT.includes(ext) ? 'video'
                        : AUDIO_EXT.includes(ext) ? 'audio'
                            : null;

            const _reposition = () => {
                if (instance.isOpen && instance._openAnchor) _position(instance._openAnchor, instance.el, instance._openOpts || {});
            };

            if (detectedMedia) {
                const tag = detectedMedia === 'image' ? 'img' : detectedMedia;
                const el = document.createElement(tag);
                el.src = url;
                if (detectedMedia !== 'image') { el.controls = true; }
                el.style.maxWidth = '100%';
                const content = _content(instance.el);
                content.innerHTML = '';
                const wrap = document.createElement('div');
                wrap.className = 'fs-fetch-content';
                wrap.appendChild(el);
                content.appendChild(wrap);
                el.addEventListener('load', _reposition);
                el.addEventListener('loadedmetadata', _reposition);
                instance.emit('loaded', { url });
                return;
            }

            const handleContent = (text, contentType) => {
                if (!instance.isOpen) return;
                const ct = contentType || '';
                let html;
                if (transform) {
                    html = transform(text, ct);
                } else if (ct.includes('application/json') || respType === 'json') {
                    try { html = `<pre>${JSON.stringify(JSON.parse(text), null, 2)}</pre>`; }
                    catch { html = `<pre>${text}</pre>`; }
                } else if (ct.startsWith('image/') || respType === 'image') {
                    html = `<img src="${url}" style="max-width:100%;display:block;" />`;
                } else if (ct.startsWith('video/') || respType === 'video') {
                    html = `<video src="${url}" controls style="max-width:100%;"></video>`;
                } else if (ct.startsWith('audio/') || respType === 'audio') {
                    html = `<audio src="${url}" controls style="width:100%;"></audio>`;
                } else {
                    html = `<pre>${text.slice(0, 3000)}</pre>`;
                }
                _content(instance.el).innerHTML = `<div class="fs-fetch-content">${html}</div>`;
                _reposition();
                const mediaEl = instance.el.querySelector('img,video,audio');
                if (mediaEl) { mediaEl.addEventListener('load', _reposition); mediaEl.addEventListener('loadedmetadata', _reposition); }
                instance.emit('loaded', { url, contentType: ct });
            };

            const handleError = err => {
                if (!instance.isOpen) return;
                _content(instance.el).innerHTML = `<div class="fs-fetch-error">Error: ${err.message || String(err)}</div>`;
                _reposition();
                instance.emit('error', { level: 2, url, error: err });
            };

            if (method === 'xhr' || method === 'ajax') {
                const xhr = new XMLHttpRequest();
                xhr.open('GET', url);
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        handleContent(xhr.responseText, xhr.getResponseHeader('Content-Type'));
                    } else {
                        handleError(new Error(`HTTP ${xhr.status}`));
                    }
                };
                xhr.onerror = () => handleError(new Error('Network error'));
                xhr.send();
            } else {
                fetch(url)
                    .then(r => {
                        const ct = r.headers.get('Content-Type') || '';
                        if (!r.ok) throw new Error(`HTTP ${r.status}`);
                        return r.text().then(text => ({ text, ct }));
                    })
                    .then(({ text, ct }) => handleContent(text, ct))
                    .catch(handleError);
            }
        },
        onClickOutside: _closeOnOutside,
    };

    _types['audio'] = {
        build(opts) {
            const content = _buildContent('fs-audio-panel');
            const audio = document.createElement('audio');
            audio.controls = true;
            audio.className = 'fs-audio-el';
            if (opts.src) audio.src = opts.src;
            content.appendChild(audio);
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            const audio = instance.el.querySelector('.fs-audio-el');
            if (!audio) return;
            audio.addEventListener('timeupdate', () => instance.emit('timeupdate', { currentTime: audio.currentTime, duration: audio.duration }));
            audio.addEventListener('ended', () => instance.emit('ended', {}));
        },
        onOpen(instance, anchor, opts) {
            const audio = instance.el.querySelector('.fs-audio-el');
            if (!audio) return;
            const o = Object.assign({}, instance.opts, opts);
            if (o.resetOnOpen) {
                audio.currentTime = 0;
            } else if (o.rememberProgress && o._savedTime != null) {
                audio.currentTime = o._savedTime;
            }
            if (o.autoplay) audio.play().catch(() => {});
        },
        onUpdate(instance, opts) {
            const audio = instance.el.querySelector('.fs-audio-el');
            if (!audio) return;
            if (opts.src != null) { audio.src = opts.src; audio.load(); }
        },
        onClose(instance) {
            const audio = instance.el.querySelector('.fs-audio-el');
            if (!audio) return;
            if (instance.opts.rememberProgress) instance.opts._savedTime = audio.currentTime;
            if (instance.opts.resetOnClose) audio.currentTime = 0;
            audio.pause();
        },
        onClickOutside: _closeOnOutside,
    };

    _types['video'] = {
        build(opts) {
            const content = _buildContent('fs-video-panel');
            const video = document.createElement('video');
            video.controls = true;
            video.className = 'fs-video-el';
            if (opts.src) video.src = opts.src;
            if (opts.poster) video.poster = opts.poster;
            if (opts.muted) video.muted = true;
            if (opts.width) video.style.width = opts.width;
            content.appendChild(video);
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            const video = instance.el.querySelector('.fs-video-el');
            if (!video) return;
            video.addEventListener('ended', () => instance.emit('ended', {}));
            video.addEventListener('timeupdate', () => instance.emit('timeupdate', { currentTime: video.currentTime, duration: video.duration }));
        },
        onOpen(instance, anchor, opts) {
            const video = instance.el.querySelector('.fs-video-el');
            if (!video) return;
            const o = Object.assign({}, instance.opts, opts);
            if (o.resetOnOpen) {
                video.currentTime = 0;
            } else if (o.rememberProgress && o._savedTime != null) {
                video.currentTime = o._savedTime;
            }
            if (o.autoplay) video.play().catch(() => {});
        },
        onUpdate(instance, opts) {
            const video = instance.el.querySelector('.fs-video-el');
            if (!video) return;
            if (opts.src != null) { video.src = opts.src; video.load(); }
            if (opts.poster != null) video.poster = opts.poster;
        },
        onClose(instance) {
            const video = instance.el.querySelector('.fs-video-el');
            if (!video) return;
            if (instance.opts.rememberProgress) instance.opts._savedTime = video.currentTime;
            if (instance.opts.resetOnClose) video.currentTime = 0;
            video.pause();
        },
        onClickOutside: _closeOnOutside,
    };

    _types['image'] = {
        build(opts) {
            const content = _buildContent('fs-image-panel');
            const img = document.createElement('img');
            img.className = 'fs-image-el';
            if (opts.src) img.src = opts.src;
            if (opts.alt) img.alt = opts.alt;
            if (opts.width) img.style.maxWidth = opts.width;
            content.appendChild(img);
            if (opts.caption) {
                const cap = document.createElement('div');
                cap.className = 'fs-image-caption';
                cap.textContent = opts.caption;
                content.appendChild(cap);
            }
            return content;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            const img = instance.el.querySelector('.fs-image-el');
            if (!img) return;
            const _reposition = () => {
                if (instance.isOpen && instance._openAnchor) _position(instance._openAnchor, instance.el, instance._openOpts || {});
            };
            img.addEventListener('load', () => { instance.emit('loaded', { src: img.src }); _reposition(); });
            img.addEventListener('error', () => instance.emit('error', { src: img.src }));
        },
        onUpdate(instance, opts) {
            const img = instance.el.querySelector('.fs-image-el');
            if (!img) return;
            if (opts.src != null) img.src = opts.src;
            if (opts.alt != null) img.alt = opts.alt;
            const cap = instance.el.querySelector('.fs-image-caption');
            if (cap && opts.caption != null) cap.textContent = opts.caption;
        },
        onClickOutside: _closeOnOutside,
    };

    function _buildContextMenuItems(el, items) {
        for (const item of items) {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'fs-ctx-sep';
                el.appendChild(sep);
                continue;
            }
            const opt = document.createElement('div');
            opt.className = 'fs-ctx-item'
                + (item.danger ? ' fs-ctx-danger' : '')
                + (item.disabled ? ' fs-ctx-disabled' : '');
            if (item.value != null) opt.dataset.value = String(item.value);
            if (item.icon) {
                const ic = document.createElement('span');
                ic.className = 'fs-ctx-icon';
                ic.textContent = item.icon;
                opt.appendChild(ic);
            }
            const lbl = document.createElement('span');
            lbl.className = 'fs-ctx-label';
            lbl.textContent = item.label;
            opt.appendChild(lbl);
            if (item.shortcut) {
                const sc = document.createElement('span');
                sc.className = 'fs-ctx-shortcut';
                sc.textContent = item.shortcut;
                opt.appendChild(sc);
            }
            el.appendChild(opt);
        }
    }

    _types['context-menu'] = {
        zPriority: 1000,
        closeOthersImmune: true,
        build(opts) {
            const content = _buildContent('fs-context-menu');
            _buildContextMenuItems(content, opts.items || []);
            return content;
        },
        onOpen(instance, anchor, merged) {
            if (!('closeOthers' in merged)) merged.closeOthers = false;
        },
        init(instance) {
            instance.el.addEventListener('click', e => e.stopPropagation());
            instance.el.addEventListener('click', e => {
                const opt = e.target.closest('.fs-ctx-item:not(.fs-ctx-disabled)');
                if (!opt) return;
                const label = opt.querySelector('.fs-ctx-label')?.textContent ?? '';
                if (instance.opts.onChange !== false) instance.emit('change', { value: opt.dataset.value, label, el: opt });
                instance.close();
            });
            if (instance.opts.global) {
                const excludeSelectors = instance.opts.excludeSelectors || ['input', 'textarea', 'select'];
                const handler = e => {
                    if (e.target.closest('[data-fs-no-context-menu]')) return;
                    if (excludeSelectors.some(sel => e.target.closest(sel))) return;
                    e.preventDefault();
                    instance.open(e, { trigger: 'contextmenu' });
                };
                document.addEventListener('contextmenu', handler);
                instance._addCleanup(() => document.removeEventListener('contextmenu', handler));
            }
        },
        onUpdate(instance, opts) {
            if (!opts.items) return;
            const content = _content(instance.el);
            content.innerHTML = '';
            _buildContextMenuItems(content, opts.items);
        },
        onClickOutside: _closeOnOutside,
    };

    _types['persist'] = {
        build(opts) {
            const content = _buildContent('fs-persist-panel');
            if (opts.content != null) content.innerHTML = opts.content;
            return content;
        },
        init(instance) { instance.el.addEventListener('click', e => e.stopPropagation()); },
        onUpdate(instance, opts) { if (opts.content != null) _content(instance.el).innerHTML = opts.content; },
    };

    _types['modal'] = {
        build(opts) {
            const content = _buildContent('fs-modal-panel');
            if (opts.content != null) content.innerHTML = opts.content;
            return content;
        },
        init(instance) { instance.el.addEventListener('click', e => e.stopPropagation()); },
        onUpdate(instance, opts) { if (opts.content != null) _content(instance.el).innerHTML = opts.content; },
    };

    return {
        registerType(name, def) {
            _types[name] = Object.assign({}, def);
        },

        registerAnimation(name, def) {
            _animations[name] = Object.assign({ duration: 150, easing: 'ease' }, def);
        },

        create(id, type, opts) {
            opts = Object.assign({}, _defaults, _typeDefaults[type] || {}, opts || {});
            if (_registry.has(id)) _registry.get(id).destroy();
            const typeDef = _types[type];
            if (!typeDef || !typeDef.build) throw new Error(`FloaterSystem.create: type "${type}" has no build()`);
            const content = typeDef.build(opts);
            if (!(content instanceof Element)) throw new Error(`FloaterSystem.create: type "${type}" build() must return an Element`);
            const el = _wrapContent(content, opts);
            el.setAttribute('hidden', '');
            _getContainer().appendChild(el);
            const instance = new FloaterInstance(id, el, type, opts);
            _registry.set(id, instance);
            el.addEventListener('click', () => _closeOnClickOutside(instance));
            if (typeDef.init) typeDef.init(instance, opts);
            if (opts.currentValue != null || opts.preferenceValue != null) _applyMarkers(el, opts);
            if (opts.closeButton) _addCloseButton(instance);
            instance.emit('create', {});
            const toFrontOn = opts.toFrontOn != null ? opts.toFrontOn : 'click';
            if (toFrontOn === 'click' || toFrontOn === 'hover') {
                const evt = toFrontOn === 'hover' ? 'mouseenter' : 'click';
                el.addEventListener(evt, () => {
                    const cont = _getContainer();
                    if (!cont.contains(el) || !instance.isOpen) return;
                    if (cont.lastElementChild !== el) cont.appendChild(el);
                    const zBoost = (_types[instance._type] && _types[instance._type].zPriority) || 0;
                    el.style.zIndex = String(++_zCounter + zBoost);
                    _updateFocusClasses();
                });
            }
            return instance;
        },

        attach(id, el, opts) {
            const type = (opts || {}).type || 'generic';
            opts = Object.assign({}, _defaults, _typeDefaults[type] || {}, opts || {});
            if (_registry.has(id)) _registry.get(id).destroy();
            const originalParent = el.parentNode;
            const nextSibling = el.nextSibling;
            const wasHidden = el.hasAttribute('hidden');
            if (wasHidden) el.removeAttribute('hidden');
            const wrapper = _wrapContent(el, opts);
            originalParent.insertBefore(wrapper, nextSibling);
            if (wasHidden) wrapper.setAttribute('hidden', '');
            const instance = new FloaterInstance(id, wrapper, type, opts);
            instance._attached = true;
            _registry.set(id, instance);
            wrapper.addEventListener('click', () => _closeOnClickOutside(instance));
            const typeDef = _types[type];
            if (typeDef && typeDef.init) typeDef.init(instance, opts);
            if (opts.currentValue != null || opts.preferenceValue != null) _applyMarkers(wrapper, opts);
            if (opts.closeButton) _addCloseButton(instance);
            instance.emit('create', {});
            return instance;
        },

        get(id) { return _registry.get(id) || null; },
        has(id) { return _registry.has(id); },
        remove(id) { const i = _registry.get(id); if (i) i.destroy(); },

        getAll(filter) { return [..._registry.values()].filter(i => _matchesFilter(i, filter)); },
        getOpen(filter) { return [..._registry.values()].filter(i => i.isOpen && _matchesFilter(i, filter)); },

        closeAll(filter, opts) {
            const includeProtected = opts && opts.includeProtected;
            for (const instance of _registry.values()) {
                if (!includeProtected && (instance.opts.protected || instance.opts.modal)) continue;
                if (_matchesFilter(instance, filter)) instance.close();
            }
        },

        bind(anchor, instance, opts) {
            opts = opts || {};
            if (typeof anchor === 'string') {
                const found = [...document.querySelectorAll(anchor)];
                if (!found.length) return [];
                const results = found.map(a => this.bind(a, instance, opts));
                return results.length === 1 ? results[0] : results;
            }
            if (anchor instanceof NodeList || Array.isArray(anchor)) {
                const arr = [...anchor];
                if (!arr.length) return [];
                const results = arr.map(a => this.bind(a, instance, opts));
                return results.length === 1 ? results[0] : results;
            }
            const trigger = opts.trigger || 'click';

            let cleanup;

            if (trigger === 'hover') {
                const delay = opts.hoverDelay != null ? opts.hoverDelay : 200;
                const openDelay = opts.hoverOpenDelay != null ? opts.hoverOpenDelay : 0;
                let timer = null;

                const scheduleClose = () => {
                    clearTimeout(timer);
                    timer = setTimeout(() => { if (instance.isOpen) instance.close({ trigger: 'hover' }); }, delay);
                };
                const cancelClose = () => clearTimeout(timer);

                const onAnchorEnter = () => {
                    cancelClose();
                    const openOpts = Object.assign({}, opts, { trigger: 'hover' });
                    if (openDelay) {
                        timer = setTimeout(() => instance.open(anchor, openOpts), openDelay);
                    } else {
                        instance.open(anchor, openOpts);
                    }
                };
                const onAnchorLeave = e => {
                    if (instance.el === e.relatedTarget || instance.el.contains(e.relatedTarget)) return;
                    scheduleClose();
                };
                const onFloaterEnter = () => cancelClose();
                const onFloaterLeave = e => {
                    if (e.relatedTarget === anchor || anchor.contains(e.relatedTarget)) return;
                    scheduleClose();
                };

                anchor.addEventListener('mouseenter', onAnchorEnter);
                anchor.addEventListener('mouseleave', onAnchorLeave);
                instance.el.addEventListener('mouseenter', onFloaterEnter);
                instance.el.addEventListener('mouseleave', onFloaterLeave);

                cleanup = () => {
                    anchor.removeEventListener('mouseenter', onAnchorEnter);
                    anchor.removeEventListener('mouseleave', onAnchorLeave);
                    instance.el.removeEventListener('mouseenter', onFloaterEnter);
                    instance.el.removeEventListener('mouseleave', onFloaterLeave);
                    clearTimeout(timer);
                };

            } else if (trigger === 'click') {
                const onMouseDown = e => {
                    e.stopPropagation();
                    instance.toggle(anchor, Object.assign({}, opts, { trigger: 'click' }));
                };
                // mousedown toggles but click still bubbles to the document handler and closes immediately; stop it
                const onClickStop = e => e.stopPropagation();
                anchor.addEventListener('mousedown', onMouseDown);
                anchor.addEventListener('click', onClickStop);
                cleanup = () => {
                    anchor.removeEventListener('mousedown', onMouseDown);
                    anchor.removeEventListener('click', onClickStop);
                };

            } else if (trigger === 'focus') {
                const onFocus = () => {
                    instance.open(anchor, Object.assign({}, opts, { trigger: 'focus' }));
                };
                // If focus moved into the floater (e.g. a spinner input/button), don't close - onFloaterFocusOut handles that case
                const onBlur = e => {
                    if (instance.el.contains(e.relatedTarget)) return;
                    instance.close({ trigger: 'focus' });
                };
                // preventDefault stops a click on a non-focusable element inside the floater from blurring the anchor
                const onFloaterMouseDown = e => e.preventDefault();
                // Close when focus leaves the floater to somewhere outside both the floater and the anchor
                const onFloaterFocusOut = e => {
                    if (e.relatedTarget === anchor || instance.el.contains(e.relatedTarget)) return;
                    instance.close({ trigger: 'focus' });
                };
                // click on anchor still bubbles to document handler after focus fires; stop it
                const onClickStop = e => e.stopPropagation();

                anchor.addEventListener('focus', onFocus);
                anchor.addEventListener('blur', onBlur);
                anchor.addEventListener('click', onClickStop);
                instance.el.addEventListener('mousedown', onFloaterMouseDown);
                instance.el.addEventListener('focusout', onFloaterFocusOut);

                cleanup = () => {
                    anchor.removeEventListener('focus', onFocus);
                    anchor.removeEventListener('blur', onBlur);
                    anchor.removeEventListener('click', onClickStop);
                    instance.el.removeEventListener('mousedown', onFloaterMouseDown);
                    instance.el.removeEventListener('focusout', onFloaterFocusOut);
                };

            } else if (trigger === 'contextmenu') {
                const onContextMenu = e => {
                    e.preventDefault();
                    instance.open(e, Object.assign({}, opts, { trigger: 'contextmenu' }));
                };
                anchor.addEventListener('contextmenu', onContextMenu);
                cleanup = () => anchor.removeEventListener('contextmenu', onContextMenu);

            } else if (trigger === 'press') {
                let active = false;
                let hovered = null;

                const setHovered = el => {
                    if (hovered === el) return;
                    if (hovered) hovered.classList.remove('fs-press-hover');
                    hovered = el;
                    if (hovered) hovered.classList.add('fs-press-hover');
                };

                const getTarget = (x, y) => {
                    const el = document.elementFromPoint(x, y);
                    return el ? el.closest('[data-value]') : null;
                };

                const onStart = e => {
                    if (e.button !== undefined && e.button !== 0) return;
                    e.preventDefault();
                    active = true;
                    instance.open(anchor, Object.assign({}, opts, { trigger: 'press' }));
                    const pt = e.touches ? e.touches[0] : e;
                    setHovered(getTarget(pt.clientX, pt.clientY));
                };

                const onMove = e => {
                    if (!active) return;
                    const pt = e.touches ? e.touches[0] : e;
                    setHovered(getTarget(pt.clientX, pt.clientY));
                };

                const onEnd = () => {
                    if (!active) return;
                    active = false;
                    const target = hovered;
                    setHovered(null);
                    if (target && instance.isOpen) target.click();
                };

                const onClickStop = e => e.stopPropagation();
                anchor.addEventListener('mousedown', onStart);
                anchor.addEventListener('click', onClickStop);
                document.addEventListener('mousemove', onMove);
                document.addEventListener('mouseup', onEnd);
                anchor.addEventListener('touchstart', onStart, { passive: false });
                document.addEventListener('touchmove', onMove, { passive: true });
                document.addEventListener('touchend', onEnd);

                cleanup = () => {
                    anchor.removeEventListener('mousedown', onStart);
                    anchor.removeEventListener('click', onClickStop);
                    document.removeEventListener('mousemove', onMove);
                    document.removeEventListener('mouseup', onEnd);
                    anchor.removeEventListener('touchstart', onStart);
                    document.removeEventListener('touchmove', onMove);
                    document.removeEventListener('touchend', onEnd);
                };
            }

            if (cleanup) instance._addCleanup(cleanup);

            if (opts.scrollSelect) {
                const cb = typeof opts.scrollSelect === 'function' ? opts.scrollSelect : null;
                const onWheel = e => {
                    const typeDef = _types[instance.type];
                    if (!cb && !typeDef?.onScrollSelect) return;
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? 1 : -1;
                    if (cb) cb(instance, delta, e);
                    else typeDef.onScrollSelect(instance, delta, e);
                };
                anchor.addEventListener('wheel', onWheel, { passive: false });
                instance.el.addEventListener('wheel', onWheel, { passive: false });
                instance._addCleanup(() => {
                    anchor.removeEventListener('wheel', onWheel);
                    instance.el.removeEventListener('wheel', onWheel);
                });
            }

            return cleanup;
        },

        setDefaults(typeOrOpts, opts) {
            if (typeof typeOrOpts === 'string') {
                _typeDefaults[typeOrOpts] = Object.assign(_typeDefaults[typeOrOpts] || {}, opts);
            } else {
                Object.assign(_defaults, typeOrOpts);
            }
        },

        on(event, fn) {
            if (!_globalHandlers[event]) _globalHandlers[event] = [];
            _globalHandlers[event].push(fn);
            return this;
        },

        off(event, fn) {
            if (!_globalHandlers[event]) return this;
            _globalHandlers[event] = _globalHandlers[event].filter(h => h !== fn);
            return this;
        },

        logger(fn, filter) {
            _logger = typeof fn === 'function' ? fn : null;
            _loggerFilter = filter || null;
        },

        _position,
        _unposition,
        _findCB,
        _applyMarkers,
    };
})();
