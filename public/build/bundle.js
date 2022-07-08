
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const proxyHandler = {
        get: (target, obj) => obj,
    };
    new Proxy({}, proxyHandler);
    const layoutMap = {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '32px'
    };
    const generateLayout = (ly) => {
        let returnHtml = '';
        for (const [attr, val] of Object.entries(ly))
            returnHtml += `${attr}:${layoutMap[val]};`;
        return returnHtml;
    };

    /* src\Flexbox.svelte generated by Svelte v3.48.0 */
    const file$6 = "src\\Flexbox.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_style_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "style", div_style_value = "display: flex; gap: " + layoutMap[/*gap*/ ctx[0]] + "; flex-direction: " + /*direction*/ ctx[1] + "; " + generateLayout(/*layout*/ ctx[2]) + "; " + /*getAlignmentProperties*/ ctx[5]() + "; width: " + /*width*/ ctx[3] + "; height: " + /*height*/ ctx[4] + ";");
    			add_location(div, file$6, 25, 0, 657);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 128)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[7],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[7])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[7], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*gap, direction, layout, width, height*/ 31 && div_style_value !== (div_style_value = "display: flex; gap: " + layoutMap[/*gap*/ ctx[0]] + "; flex-direction: " + /*direction*/ ctx[1] + "; " + generateLayout(/*layout*/ ctx[2]) + "; " + /*getAlignmentProperties*/ ctx[5]() + "; width: " + /*width*/ ctx[3] + "; height: " + /*height*/ ctx[4] + ";")) {
    				attr_dev(div, "style", div_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Flexbox', slots, ['default']);
    	let { gap = 'xl' } = $$props;
    	let { direction = 'column' } = $$props;
    	let { layout = {} } = $$props;
    	let { align = ['start', 'start'] } = $$props;
    	let { width = 'fit-content', height = 'fit-content' } = $$props;

    	const map = {
    		center: 'center',
    		start: 'flex-start',
    		end: 'flex-end',
    		0: 'align-items',
    		1: 'justify-content'
    	};

    	const getAlignmentProperties = () => {
    		let html = '';

    		for (let i = 0; i < 2; i++) {
    			let elem = align[i];
    			let value = map[elem];
    			let key = map[i];
    			html += `${key}:${value};`;
    		}

    		return html;
    	};

    	const writable_props = ['gap', 'direction', 'layout', 'align', 'width', 'height'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Flexbox> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('gap' in $$props) $$invalidate(0, gap = $$props.gap);
    		if ('direction' in $$props) $$invalidate(1, direction = $$props.direction);
    		if ('layout' in $$props) $$invalidate(2, layout = $$props.layout);
    		if ('align' in $$props) $$invalidate(6, align = $$props.align);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('height' in $$props) $$invalidate(4, height = $$props.height);
    		if ('$$scope' in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		generateLayout,
    		layoutMap,
    		gap,
    		direction,
    		layout,
    		align,
    		width,
    		height,
    		map,
    		getAlignmentProperties
    	});

    	$$self.$inject_state = $$props => {
    		if ('gap' in $$props) $$invalidate(0, gap = $$props.gap);
    		if ('direction' in $$props) $$invalidate(1, direction = $$props.direction);
    		if ('layout' in $$props) $$invalidate(2, layout = $$props.layout);
    		if ('align' in $$props) $$invalidate(6, align = $$props.align);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('height' in $$props) $$invalidate(4, height = $$props.height);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		gap,
    		direction,
    		layout,
    		width,
    		height,
    		getAlignmentProperties,
    		align,
    		$$scope,
    		slots
    	];
    }

    class Flexbox extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			gap: 0,
    			direction: 1,
    			layout: 2,
    			align: 6,
    			width: 3,
    			height: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Flexbox",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get gap() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gap(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get direction() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set direction(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Flexbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Flexbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Banner\Banner.svelte generated by Svelte v3.48.0 */
    const file$5 = "src\\Banner\\Banner.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let h1;
    	let t0;
    	let h1_class_value;
    	let t1;
    	let main_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[1]);
    			t1 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(h1, "class", h1_class_value = "" + (null_to_empty(/*font*/ ctx[0]) + " svelte-aqs1lm"));
    			add_location(h1, file$5, 6, 4, 139);
    			attr_dev(main, "class", main_class_value = "" + (null_to_empty(/*font*/ ctx[0]) + " svelte-aqs1lm"));
    			add_location(main, file$5, 5, 0, 112);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, t0);
    			append_dev(main, t1);

    			if (default_slot) {
    				default_slot.m(main, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*title*/ 2) set_data_dev(t0, /*title*/ ctx[1]);

    			if (!current || dirty & /*font*/ 1 && h1_class_value !== (h1_class_value = "" + (null_to_empty(/*font*/ ctx[0]) + " svelte-aqs1lm"))) {
    				attr_dev(h1, "class", h1_class_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[2],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[2])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*font*/ 1 && main_class_value !== (main_class_value = "" + (null_to_empty(/*font*/ ctx[0]) + " svelte-aqs1lm"))) {
    				attr_dev(main, "class", main_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Banner', slots, ['default']);
    	let { font = 'sans-serif' } = $$props;
    	let { title } = $$props;
    	const writable_props = ['font', 'title'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Banner> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('font' in $$props) $$invalidate(0, font = $$props.font);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('$$scope' in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ font, title });

    	$$self.$inject_state = $$props => {
    		if ('font' in $$props) $$invalidate(0, font = $$props.font);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [font, title, $$scope, slots];
    }

    class Banner extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { font: 0, title: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Banner",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Banner> was created without expected prop 'title'");
    		}
    	}

    	get font() {
    		throw new Error("<Banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set font(value) {
    		throw new Error("<Banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Banner>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Banner>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Banner\Actions.svelte generated by Svelte v3.48.0 */

    // (4:0) <Flexbox width="100%" align={['center', 'end']} gap="sm" direction="row">
    function create_default_slot$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[0].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(4:0) <Flexbox width=\\\"100%\\\" align={['center', 'end']} gap=\\\"sm\\\" direction=\\\"row\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let flexbox;
    	let current;

    	flexbox = new Flexbox({
    			props: {
    				width: "100%",
    				align: ['center', 'end'],
    				gap: "sm",
    				direction: "row",
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flexbox.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(flexbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flexbox_changes = {};

    			if (dirty & /*$$scope*/ 2) {
    				flexbox_changes.$$scope = { dirty, ctx };
    			}

    			flexbox.$set(flexbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flexbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flexbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flexbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Actions', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Actions> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ Flexbox });
    	return [slots, $$scope];
    }

    class Actions extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Actions",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Banner\Description.svelte generated by Svelte v3.48.0 */

    const file$4 = "src\\Banner\\Description.svelte";

    function create_fragment$5(ctx) {
    	let p;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			p = element("p");
    			if (default_slot) default_slot.c();
    			attr_dev(p, "class", "svelte-usqlua");
    			add_location(p, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);

    			if (default_slot) {
    				default_slot.m(p, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Description', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Description> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Description extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Description",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\Button.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\Button.svelte";

    function create_fragment$4(ctx) {
    	let button;
    	let button_class_value;
    	let button_style_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", button_class_value = "" + ((/*compact*/ ctx[2] ? 'compact' : '-default') + " " + /*appearance*/ ctx[3] + " " + /*font*/ ctx[4] + " svelte-e4n3h4"));
    			attr_dev(button, "style", button_style_value = "width: " + (/*fillContainer*/ ctx[1] ? '100%' : 'fit-content') + "; " + generateLayout(/*layout*/ ctx[5]));
    			add_location(button, file$3, 9, 0, 271);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*clickHandler*/ ctx[0])) /*clickHandler*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*compact, appearance, font*/ 28 && button_class_value !== (button_class_value = "" + ((/*compact*/ ctx[2] ? 'compact' : '-default') + " " + /*appearance*/ ctx[3] + " " + /*font*/ ctx[4] + " svelte-e4n3h4"))) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty & /*fillContainer, layout*/ 34 && button_style_value !== (button_style_value = "width: " + (/*fillContainer*/ ctx[1] ? '100%' : 'fit-content') + "; " + generateLayout(/*layout*/ ctx[5]))) {
    				attr_dev(button, "style", button_style_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);

    	let { clickHandler = () => {
    		
    	} } = $$props;

    	let { fillContainer = false } = $$props;
    	let { compact = false } = $$props;
    	let { appearance = 'default' } = $$props;
    	let { font = 'sans-serif' } = $$props;
    	let { layout = {} } = $$props;
    	const writable_props = ['clickHandler', 'fillContainer', 'compact', 'appearance', 'font', 'layout'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('clickHandler' in $$props) $$invalidate(0, clickHandler = $$props.clickHandler);
    		if ('fillContainer' in $$props) $$invalidate(1, fillContainer = $$props.fillContainer);
    		if ('compact' in $$props) $$invalidate(2, compact = $$props.compact);
    		if ('appearance' in $$props) $$invalidate(3, appearance = $$props.appearance);
    		if ('font' in $$props) $$invalidate(4, font = $$props.font);
    		if ('layout' in $$props) $$invalidate(5, layout = $$props.layout);
    		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		generateLayout,
    		clickHandler,
    		fillContainer,
    		compact,
    		appearance,
    		font,
    		layout
    	});

    	$$self.$inject_state = $$props => {
    		if ('clickHandler' in $$props) $$invalidate(0, clickHandler = $$props.clickHandler);
    		if ('fillContainer' in $$props) $$invalidate(1, fillContainer = $$props.fillContainer);
    		if ('compact' in $$props) $$invalidate(2, compact = $$props.compact);
    		if ('appearance' in $$props) $$invalidate(3, appearance = $$props.appearance);
    		if ('font' in $$props) $$invalidate(4, font = $$props.font);
    		if ('layout' in $$props) $$invalidate(5, layout = $$props.layout);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [clickHandler, fillContainer, compact, appearance, font, layout, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			clickHandler: 0,
    			fillContainer: 1,
    			compact: 2,
    			appearance: 3,
    			font: 4,
    			layout: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get clickHandler() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set clickHandler(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fillContainer() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fillContainer(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get compact() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set compact(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get appearance() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set appearance(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get font() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set font(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layout() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Code.svelte generated by Svelte v3.48.0 */

    const file$2 = "src\\Code.svelte";

    function create_fragment$3(ctx) {
    	let code;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			code = element("code");
    			if (default_slot) default_slot.c();
    			attr_dev(code, "class", "svelte-bhnc6");
    			add_location(code, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, code, anchor);

    			if (default_slot) {
    				default_slot.m(code, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(code);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Code', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Code> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class Code extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Code",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Range.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\Range.svelte";

    // (13:4) {#if title}
    function create_if_block_1$1(ctx) {
    	let h6;
    	let t;
    	let h6_class_value;

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			t = text(/*title*/ ctx[6]);
    			attr_dev(h6, "class", h6_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-oy8tpv"));
    			add_location(h6, file$1, 13, 8, 355);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);
    			append_dev(h6, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 64) set_data_dev(t, /*title*/ ctx[6]);

    			if (dirty & /*font*/ 4 && h6_class_value !== (h6_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-oy8tpv"))) {
    				attr_dev(h6, "class", h6_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(13:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (17:4) {#if instructions}
    function create_if_block$1(ctx) {
    	let p;
    	let t;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*instructions*/ ctx[7]);
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-oy8tpv"));
    			add_location(p, file$1, 17, 8, 536);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*instructions*/ 128) set_data_dev(t, /*instructions*/ ctx[7]);

    			if (dirty & /*font*/ 4 && p_class_value !== (p_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-oy8tpv"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(17:4) {#if instructions}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let main;
    	let t0;
    	let input;
    	let input_style_value;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*title*/ ctx[6] && create_if_block_1$1(ctx);
    	let if_block1 = /*instructions*/ ctx[7] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(input, "type", "range");
    			attr_dev(input, "style", input_style_value = generateLayout(/*layout*/ ctx[1]));
    			attr_dev(input, "min", /*min*/ ctx[4]);
    			attr_dev(input, "max", /*max*/ ctx[5]);
    			attr_dev(input, "class", "svelte-oy8tpv");
    			add_location(input, file$1, 15, 4, 403);
    			set_style(main, "width", /*width*/ ctx[3]);
    			attr_dev(main, "class", "svelte-oy8tpv");
    			add_location(main, file$1, 11, 0, 299);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_input_handler*/ ctx[8]),
    					listen_dev(input, "input", /*input_change_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*title*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*layout*/ 2 && input_style_value !== (input_style_value = generateLayout(/*layout*/ ctx[1]))) {
    				attr_dev(input, "style", input_style_value);
    			}

    			if (dirty & /*min*/ 16) {
    				attr_dev(input, "min", /*min*/ ctx[4]);
    			}

    			if (dirty & /*max*/ 32) {
    				attr_dev(input, "max", /*max*/ ctx[5]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (/*instructions*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*width*/ 8) {
    				set_style(main, "width", /*width*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Range', slots, []);
    	let { layout = {} } = $$props;
    	let { font = 'sans-serif' } = $$props;
    	let { value = '' } = $$props;
    	let { width = '300px' } = $$props;
    	let { min = 0 } = $$props;
    	let { max = 100 } = $$props;
    	let { title = undefined } = $$props;
    	let { instructions = undefined } = $$props;
    	const writable_props = ['layout', 'font', 'value', 'width', 'min', 'max', 'title', 'instructions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Range> was created with unknown prop '${key}'`);
    	});

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('layout' in $$props) $$invalidate(1, layout = $$props.layout);
    		if ('font' in $$props) $$invalidate(2, font = $$props.font);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('min' in $$props) $$invalidate(4, min = $$props.min);
    		if ('max' in $$props) $$invalidate(5, max = $$props.max);
    		if ('title' in $$props) $$invalidate(6, title = $$props.title);
    		if ('instructions' in $$props) $$invalidate(7, instructions = $$props.instructions);
    	};

    	$$self.$capture_state = () => ({
    		generateLayout,
    		layout,
    		font,
    		value,
    		width,
    		min,
    		max,
    		title,
    		instructions
    	});

    	$$self.$inject_state = $$props => {
    		if ('layout' in $$props) $$invalidate(1, layout = $$props.layout);
    		if ('font' in $$props) $$invalidate(2, font = $$props.font);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('width' in $$props) $$invalidate(3, width = $$props.width);
    		if ('min' in $$props) $$invalidate(4, min = $$props.min);
    		if ('max' in $$props) $$invalidate(5, max = $$props.max);
    		if ('title' in $$props) $$invalidate(6, title = $$props.title);
    		if ('instructions' in $$props) $$invalidate(7, instructions = $$props.instructions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		layout,
    		font,
    		width,
    		min,
    		max,
    		title,
    		instructions,
    		input_change_input_handler
    	];
    }

    class Range extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			layout: 1,
    			font: 2,
    			value: 0,
    			width: 3,
    			min: 4,
    			max: 5,
    			title: 6,
    			instructions: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Range",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get layout() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get font() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set font(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get instructions() {
    		throw new Error("<Range>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set instructions(value) {
    		throw new Error("<Range>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Textfield.svelte generated by Svelte v3.48.0 */
    const file = "src\\Textfield.svelte";

    // (12:4) {#if title}
    function create_if_block_1(ctx) {
    	let h6;
    	let t;
    	let h6_class_value;

    	const block = {
    		c: function create() {
    			h6 = element("h6");
    			t = text(/*title*/ ctx[5]);
    			attr_dev(h6, "class", h6_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"));
    			add_location(h6, file, 12, 8, 341);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h6, anchor);
    			append_dev(h6, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 32) set_data_dev(t, /*title*/ ctx[5]);

    			if (dirty & /*font*/ 4 && h6_class_value !== (h6_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"))) {
    				attr_dev(h6, "class", h6_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h6);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(12:4) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (16:4) {#if instructions}
    function create_if_block(ctx) {
    	let p;
    	let t;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*instructions*/ ctx[6]);
    			attr_dev(p, "class", p_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"));
    			add_location(p, file, 16, 8, 526);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*instructions*/ 64) set_data_dev(t, /*instructions*/ ctx[6]);

    			if (dirty & /*font*/ 4 && p_class_value !== (p_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"))) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(16:4) {#if instructions}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let t0;
    	let input;
    	let input_style_value;
    	let input_class_value;
    	let t1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*title*/ ctx[5] && create_if_block_1(ctx);
    	let if_block1 = /*instructions*/ ctx[6] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			input = element("input");
    			t1 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(input, "type", "text");
    			attr_dev(input, "style", input_style_value = generateLayout(/*layout*/ ctx[1]));
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"));
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			add_location(input, file, 14, 4, 389);
    			set_style(main, "width", /*width*/ ctx[4]);
    			attr_dev(main, "class", "svelte-77i800");
    			add_location(main, file, 10, 0, 285);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t0);
    			append_dev(main, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(main, t1);
    			if (if_block1) if_block1.m(main, null);

    			if (!mounted) {
    				dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[7]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*title*/ ctx[5]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1(ctx);
    					if_block0.c();
    					if_block0.m(main, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*layout*/ 2 && input_style_value !== (input_style_value = generateLayout(/*layout*/ ctx[1]))) {
    				attr_dev(input, "style", input_style_value);
    			}

    			if (dirty & /*font*/ 4 && input_class_value !== (input_class_value = "" + (null_to_empty(/*font*/ ctx[2]) + " svelte-77i800"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (/*instructions*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					if_block1.m(main, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*width*/ 16) {
    				set_style(main, "width", /*width*/ ctx[4]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Textfield', slots, []);
    	let { layout = {} } = $$props;
    	let { font = 'sans-serif' } = $$props;
    	let { value = '' } = $$props;
    	let { placeholder = '' } = $$props;
    	let { width = '300px' } = $$props;
    	let { title = undefined } = $$props;
    	let { instructions = undefined } = $$props;
    	const writable_props = ['layout', 'font', 'value', 'placeholder', 'width', 'title', 'instructions'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Textfield> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$$set = $$props => {
    		if ('layout' in $$props) $$invalidate(1, layout = $$props.layout);
    		if ('font' in $$props) $$invalidate(2, font = $$props.font);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    		if ('title' in $$props) $$invalidate(5, title = $$props.title);
    		if ('instructions' in $$props) $$invalidate(6, instructions = $$props.instructions);
    	};

    	$$self.$capture_state = () => ({
    		generateLayout,
    		layout,
    		font,
    		value,
    		placeholder,
    		width,
    		title,
    		instructions
    	});

    	$$self.$inject_state = $$props => {
    		if ('layout' in $$props) $$invalidate(1, layout = $$props.layout);
    		if ('font' in $$props) $$invalidate(2, font = $$props.font);
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('placeholder' in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ('width' in $$props) $$invalidate(4, width = $$props.width);
    		if ('title' in $$props) $$invalidate(5, title = $$props.title);
    		if ('instructions' in $$props) $$invalidate(6, instructions = $$props.instructions);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		value,
    		layout,
    		font,
    		placeholder,
    		width,
    		title,
    		instructions,
    		input_input_handler
    	];
    }

    class Textfield extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			layout: 1,
    			font: 2,
    			value: 0,
    			placeholder: 3,
    			width: 4,
    			title: 5,
    			instructions: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Textfield",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get layout() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layout(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get font() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set font(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get instructions() {
    		throw new Error("<Textfield>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set instructions(value) {
    		throw new Error("<Textfield>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */

    // (22:3) <Button>
    function create_default_slot_10(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_10.name,
    		type: "slot",
    		source: "(22:3) <Button>",
    		ctx
    	});

    	return block;
    }

    // (23:3) <Button appearance="primary">
    function create_default_slot_9(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Login");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_9.name,
    		type: "slot",
    		source: "(23:3) <Button appearance=\\\"primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (21:2) <Flexbox width="100%" align={['end', 'end']} gap="sm" direction="row">
    function create_default_slot_8(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				$$slots: { default: [create_default_slot_10] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				appearance: "primary",
    				$$slots: { default: [create_default_slot_9] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_8.name,
    		type: "slot",
    		source: "(21:2) <Flexbox width=\\\"100%\\\" align={['end', 'end']} gap=\\\"sm\\\" direction=\\\"row\\\">",
    		ctx
    	});

    	return block;
    }

    // (17:1) <Flexbox gap="lg" width="300px" height="fit-content" align={['center', 'center']}>
    function create_default_slot_7(ctx) {
    	let textfield0;
    	let t0;
    	let textfield1;
    	let t1;
    	let range;
    	let updating_value;
    	let t2;
    	let flexbox;
    	let current;

    	textfield0 = new Textfield({
    			props: {
    				title: "Email",
    				instructions: "Must be from gmail or yahoo",
    				placeholder: "example@gmail.com"
    			},
    			$$inline: true
    		});

    	textfield1 = new Textfield({
    			props: {
    				title: "Password",
    				placeholder: "mypassword@logi7345"
    			},
    			$$inline: true
    		});

    	function range_value_binding(value) {
    		/*range_value_binding*/ ctx[1](value);
    	}

    	let range_props = {
    		width: "100%",
    		title: "Phone number",
    		instructions: /*value*/ ctx[0],
    		min: 0,
    		max: 9999999999
    	};

    	if (/*value*/ ctx[0] !== void 0) {
    		range_props.value = /*value*/ ctx[0];
    	}

    	range = new Range({ props: range_props, $$inline: true });
    	binding_callbacks.push(() => bind(range, 'value', range_value_binding));

    	flexbox = new Flexbox({
    			props: {
    				width: "100%",
    				align: ['end', 'end'],
    				gap: "sm",
    				direction: "row",
    				$$slots: { default: [create_default_slot_8] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(textfield0.$$.fragment);
    			t0 = space();
    			create_component(textfield1.$$.fragment);
    			t1 = space();
    			create_component(range.$$.fragment);
    			t2 = space();
    			create_component(flexbox.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(textfield0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(textfield1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(range, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(flexbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const range_changes = {};
    			if (dirty & /*value*/ 1) range_changes.instructions = /*value*/ ctx[0];

    			if (!updating_value && dirty & /*value*/ 1) {
    				updating_value = true;
    				range_changes.value = /*value*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			range.$set(range_changes);
    			const flexbox_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				flexbox_changes.$$scope = { dirty, ctx };
    			}

    			flexbox.$set(flexbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(textfield0.$$.fragment, local);
    			transition_in(textfield1.$$.fragment, local);
    			transition_in(range.$$.fragment, local);
    			transition_in(flexbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(textfield0.$$.fragment, local);
    			transition_out(textfield1.$$.fragment, local);
    			transition_out(range.$$.fragment, local);
    			transition_out(flexbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(textfield0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(textfield1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(range, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(flexbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_7.name,
    		type: "slot",
    		source: "(17:1) <Flexbox gap=\\\"lg\\\" width=\\\"300px\\\" height=\\\"fit-content\\\" align={['center', 'center']}>",
    		ctx
    	});

    	return block;
    }

    // (28:25) <Code>
    function create_default_slot_6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("h432Kkl23Jhe3");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(28:25) <Code>",
    		ctx
    	});

    	return block;
    }

    // (27:2) <BannerDescription>
    function create_default_slot_5(ctx) {
    	let t0;
    	let code;
    	let t1;
    	let current;

    	code = new Code({
    			props: {
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = text("This will delete post ");
    			create_component(code.$$.fragment);
    			t1 = text(" and all replies permanently.");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			mount_component(code, target, anchor);
    			insert_dev(target, t1, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const code_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				code_changes.$$scope = { dirty, ctx };
    			}

    			code.$set(code_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(code.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(code.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			destroy_component(code, detaching);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(27:2) <BannerDescription>",
    		ctx
    	});

    	return block;
    }

    // (31:3) <Button appearance="link-secondary" compact>
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Cancel");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(31:3) <Button appearance=\\\"link-secondary\\\" compact>",
    		ctx
    	});

    	return block;
    }

    // (32:3) <Button appearance="danger">
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(32:3) <Button appearance=\\\"danger\\\">",
    		ctx
    	});

    	return block;
    }

    // (30:2) <BannerActions>
    function create_default_slot_2(ctx) {
    	let button0;
    	let t;
    	let button1;
    	let current;

    	button0 = new Button({
    			props: {
    				appearance: "link-secondary",
    				compact: true,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				appearance: "danger",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(button0.$$.fragment);
    			t = space();
    			create_component(button1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(button0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(button1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button0_changes.$$scope = { dirty, ctx };
    			}

    			button0.$set(button0_changes);
    			const button1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button1_changes.$$scope = { dirty, ctx };
    			}

    			button1.$set(button1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(button0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(button1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(30:2) <BannerActions>",
    		ctx
    	});

    	return block;
    }

    // (26:1) <Banner title="Delete this post">
    function create_default_slot_1(ctx) {
    	let bannerdescription;
    	let t;
    	let banneractions;
    	let current;

    	bannerdescription = new Description({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	banneractions = new Actions({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(bannerdescription.$$.fragment);
    			t = space();
    			create_component(banneractions.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(bannerdescription, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(banneractions, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const bannerdescription_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				bannerdescription_changes.$$scope = { dirty, ctx };
    			}

    			bannerdescription.$set(bannerdescription_changes);
    			const banneractions_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				banneractions_changes.$$scope = { dirty, ctx };
    			}

    			banneractions.$set(banneractions_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(bannerdescription.$$.fragment, local);
    			transition_in(banneractions.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(bannerdescription.$$.fragment, local);
    			transition_out(banneractions.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(bannerdescription, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(banneractions, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(26:1) <Banner title=\\\"Delete this post\\\">",
    		ctx
    	});

    	return block;
    }

    // (15:0) <Flexbox width="100vw" height="100vh" align={['center', 'center']}>
    function create_default_slot(ctx) {
    	let flexbox;
    	let t;
    	let banner;
    	let current;

    	flexbox = new Flexbox({
    			props: {
    				gap: "lg",
    				width: "300px",
    				height: "fit-content",
    				align: ['center', 'center'],
    				$$slots: { default: [create_default_slot_7] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	banner = new Banner({
    			props: {
    				title: "Delete this post",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flexbox.$$.fragment);
    			t = space();
    			create_component(banner.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(flexbox, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(banner, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const flexbox_changes = {};

    			if (dirty & /*$$scope, value*/ 5) {
    				flexbox_changes.$$scope = { dirty, ctx };
    			}

    			flexbox.$set(flexbox_changes);
    			const banner_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				banner_changes.$$scope = { dirty, ctx };
    			}

    			banner.$set(banner_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flexbox.$$.fragment, local);
    			transition_in(banner.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flexbox.$$.fragment, local);
    			transition_out(banner.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flexbox, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(banner, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(15:0) <Flexbox width=\\\"100vw\\\" height=\\\"100vh\\\" align={['center', 'center']}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let flexbox;
    	let current;

    	flexbox = new Flexbox({
    			props: {
    				width: "100vw",
    				height: "100vh",
    				align: ['center', 'center'],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(flexbox.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(flexbox, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const flexbox_changes = {};

    			if (dirty & /*$$scope, value*/ 5) {
    				flexbox_changes.$$scope = { dirty, ctx };
    			}

    			flexbox.$set(flexbox_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(flexbox.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(flexbox.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(flexbox, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let value = '911';
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function range_value_binding(value$1) {
    		value = value$1;
    		$$invalidate(0, value);
    	}

    	$$self.$capture_state = () => ({
    		Banner,
    		BannerActions: Actions,
    		BannerDescription: Description,
    		Button,
    		Code,
    		Flexbox,
    		Range,
    		Textfield,
    		value
    	});

    	$$self.$inject_state = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [value, range_value_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
