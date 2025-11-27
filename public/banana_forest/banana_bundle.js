
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
	'use strict';

	/** @returns {void} */
	function noop() {}

	const identity = (x) => x;

	/** @returns {void} */
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

	/**
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function run_all(fns) {
		fns.forEach(run);
	}

	/**
	 * @param {any} thing
	 * @returns {thing is Function}
	 */
	function is_function(thing) {
		return typeof thing === 'function';
	}

	/** @returns {boolean} */
	function safe_not_equal(a, b) {
		return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
	}

	let src_url_equal_anchor;

	/**
	 * @param {string} element_src
	 * @param {string} url
	 * @returns {boolean}
	 */
	function src_url_equal(element_src, url) {
		if (element_src === url) return true;
		if (!src_url_equal_anchor) {
			src_url_equal_anchor = document.createElement('a');
		}
		// This is actually faster than doing URL(..).href
		src_url_equal_anchor.href = url;
		return element_src === src_url_equal_anchor.href;
	}

	/** @returns {boolean} */
	function is_empty(obj) {
		return Object.keys(obj).length === 0;
	}

	const is_client = typeof window !== 'undefined';

	/** @type {() => number} */
	let now = is_client ? () => window.performance.now() : () => Date.now();

	let raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;

	const tasks = new Set();

	/**
	 * @param {number} now
	 * @returns {void}
	 */
	function run_tasks(now) {
		tasks.forEach((task) => {
			if (!task.c(now)) {
				tasks.delete(task);
				task.f();
			}
		});
		if (tasks.size !== 0) raf(run_tasks);
	}

	/**
	 * Creates a new task that runs on each raf frame
	 * until it returns a falsy value or is aborted
	 * @param {import('./private.js').TaskCallback} callback
	 * @returns {import('./private.js').Task}
	 */
	function loop(callback) {
		/** @type {import('./private.js').TaskEntry} */
		let task;
		if (tasks.size === 0) raf(run_tasks);
		return {
			promise: new Promise((fulfill) => {
				tasks.add((task = { c: callback, f: fulfill }));
			}),
			abort() {
				tasks.delete(task);
			}
		};
	}

	/** @type {typeof globalThis} */
	const globals =
		typeof window !== 'undefined'
			? window
			: typeof globalThis !== 'undefined'
			? globalThis
			: // @ts-ignore Node typings have this
			  global;

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append(target, node) {
		target.appendChild(node);
	}

	/**
	 * @param {Node} node
	 * @returns {ShadowRoot | Document}
	 */
	function get_root_for_style(node) {
		if (!node) return document;
		const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
		if (root && /** @type {ShadowRoot} */ (root).host) {
			return /** @type {ShadowRoot} */ (root);
		}
		return node.ownerDocument;
	}

	/**
	 * @param {Node} node
	 * @returns {CSSStyleSheet}
	 */
	function append_empty_stylesheet(node) {
		const style_element = element('style');
		// For transitions to work without 'style-src: unsafe-inline' Content Security Policy,
		// these empty tags need to be allowed with a hash as a workaround until we move to the Web Animations API.
		// Using the hash for the empty string (for an empty tag) works in all browsers except Safari.
		// So as a workaround for the workaround, when we append empty style tags we set their content to /* empty */.
		// The hash 'sha256-9OlNO0DNEeaVzHL4RZwCLsBHA8WBQ8toBp/4F5XV2nc=' will then work even in Safari.
		style_element.textContent = '/* empty */';
		append_stylesheet(get_root_for_style(node), style_element);
		return style_element.sheet;
	}

	/**
	 * @param {ShadowRoot | Document} node
	 * @param {HTMLStyleElement} style
	 * @returns {CSSStyleSheet}
	 */
	function append_stylesheet(node, style) {
		append(/** @type {Document} */ (node).head || node, style);
		return style.sheet;
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert(target, node, anchor) {
		target.insertBefore(node, anchor || null);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach(node) {
		if (node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	/**
	 * @returns {void} */
	function destroy_each(iterations, detaching) {
		for (let i = 0; i < iterations.length; i += 1) {
			if (iterations[i]) iterations[i].d(detaching);
		}
	}

	/**
	 * @template {keyof HTMLElementTagNameMap} K
	 * @param {K} name
	 * @returns {HTMLElementTagNameMap[K]}
	 */
	function element(name) {
		return document.createElement(name);
	}

	/**
	 * @template {keyof SVGElementTagNameMap} K
	 * @param {K} name
	 * @returns {SVGElement}
	 */
	function svg_element(name) {
		return document.createElementNS('http://www.w3.org/2000/svg', name);
	}

	/**
	 * @param {string} data
	 * @returns {Text}
	 */
	function text(data) {
		return document.createTextNode(data);
	}

	/**
	 * @returns {Text} */
	function space() {
		return text(' ');
	}

	/**
	 * @param {EventTarget} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @returns {() => void}
	 */
	function listen(node, event, handler, options) {
		node.addEventListener(event, handler, options);
		return () => node.removeEventListener(event, handler, options);
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr(node, attribute, value) {
		if (value == null) node.removeAttribute(attribute);
		else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
	}

	/**
	 * @param {Element} element
	 * @returns {ChildNode[]}
	 */
	function children(element) {
		return Array.from(element.childNodes);
	}

	/**
	 * @returns {void} */
	function set_style(node, key, value, important) {
		if (value == null) {
			node.style.removeProperty(key);
		} else {
			node.style.setProperty(key, value, important ? 'important' : '');
		}
	}

	/**
	 * @returns {void} */
	function toggle_class(element, name, toggle) {
		// The `!!` is required because an `undefined` flag means flipping the current state.
		element.classList.toggle(name, !!toggle);
	}

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @param {{ bubbles?: boolean, cancelable?: boolean }} [options]
	 * @returns {CustomEvent<T>}
	 */
	function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
		return new CustomEvent(type, { detail, bubbles, cancelable });
	}
	/** */
	class HtmlTag {
		/**
		 * @private
		 * @default false
		 */
		is_svg = false;
		/** parent for creating node */
		e = undefined;
		/** html tag nodes */
		n = undefined;
		/** target */
		t = undefined;
		/** anchor */
		a = undefined;
		constructor(is_svg = false) {
			this.is_svg = is_svg;
			this.e = this.n = null;
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		c(html) {
			this.h(html);
		}

		/**
		 * @param {string} html
		 * @param {HTMLElement | SVGElement} target
		 * @param {HTMLElement | SVGElement} anchor
		 * @returns {void}
		 */
		m(html, target, anchor = null) {
			if (!this.e) {
				if (this.is_svg)
					this.e = svg_element(/** @type {keyof SVGElementTagNameMap} */ (target.nodeName));
				/** #7364  target for <template> may be provided as #document-fragment(11) */ else
					this.e = element(
						/** @type {keyof HTMLElementTagNameMap} */ (
							target.nodeType === 11 ? 'TEMPLATE' : target.nodeName
						)
					);
				this.t =
					target.tagName !== 'TEMPLATE'
						? target
						: /** @type {HTMLTemplateElement} */ (target).content;
				this.c(html);
			}
			this.i(anchor);
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		h(html) {
			this.e.innerHTML = html;
			this.n = Array.from(
				this.e.nodeName === 'TEMPLATE' ? this.e.content.childNodes : this.e.childNodes
			);
		}

		/**
		 * @returns {void} */
		i(anchor) {
			for (let i = 0; i < this.n.length; i += 1) {
				insert(this.t, this.n[i], anchor);
			}
		}

		/**
		 * @param {string} html
		 * @returns {void}
		 */
		p(html) {
			this.d();
			this.h(html);
			this.i(this.a);
		}

		/**
		 * @returns {void} */
		d() {
			this.n.forEach(detach);
		}
	}

	/**
	 * @typedef {Node & {
	 * 	claim_order?: number;
	 * 	hydrate_init?: true;
	 * 	actual_end_child?: NodeEx;
	 * 	childNodes: NodeListOf<NodeEx>;
	 * }} NodeEx
	 */

	/** @typedef {ChildNode & NodeEx} ChildNodeEx */

	/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

	/**
	 * @typedef {ChildNodeEx[] & {
	 * 	claim_info?: {
	 * 		last_index: number;
	 * 		total_claimed: number;
	 * 	};
	 * }} ChildNodeArray
	 */

	// we need to store the information for multiple documents because a Svelte application could also contain iframes
	// https://github.com/sveltejs/svelte/issues/3624
	/** @type {Map<Document | ShadowRoot, import('./private.d.ts').StyleInformation>} */
	const managed_styles = new Map();

	let active = 0;

	// https://github.com/darkskyapp/string-hash/blob/master/index.js
	/**
	 * @param {string} str
	 * @returns {number}
	 */
	function hash(str) {
		let hash = 5381;
		let i = str.length;
		while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
		return hash >>> 0;
	}

	/**
	 * @param {Document | ShadowRoot} doc
	 * @param {Element & ElementCSSInlineStyle} node
	 * @returns {{ stylesheet: any; rules: {}; }}
	 */
	function create_style_information(doc, node) {
		const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
		managed_styles.set(doc, info);
		return info;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {number} a
	 * @param {number} b
	 * @param {number} duration
	 * @param {number} delay
	 * @param {(t: number) => number} ease
	 * @param {(t: number, u: number) => string} fn
	 * @param {number} uid
	 * @returns {string}
	 */
	function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
		const step = 16.666 / duration;
		let keyframes = '{\n';
		for (let p = 0; p <= 1; p += step) {
			const t = a + (b - a) * ease(p);
			keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
		}
		const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
		const name = `__svelte_${hash(rule)}_${uid}`;
		const doc = get_root_for_style(node);
		const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
		if (!rules[name]) {
			rules[name] = true;
			stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
		}
		const animation = node.style.animation || '';
		node.style.animation = `${
		animation ? `${animation}, ` : ''
	}${name} ${duration}ms linear ${delay}ms 1 both`;
		active += 1;
		return name;
	}

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {string} [name]
	 * @returns {void}
	 */
	function delete_rule(node, name) {
		const previous = (node.style.animation || '').split(', ');
		const next = previous.filter(
			name
				? (anim) => anim.indexOf(name) < 0 // remove specific animation
				: (anim) => anim.indexOf('__svelte') === -1 // remove all Svelte animations
		);
		const deleted = previous.length - next.length;
		if (deleted) {
			node.style.animation = next.join(', ');
			active -= deleted;
			if (!active) clear_rules();
		}
	}

	/** @returns {void} */
	function clear_rules() {
		raf(() => {
			if (active) return;
			managed_styles.forEach((info) => {
				const { ownerNode } = info.stylesheet;
				// there is no ownerNode if it runs on jsdom.
				if (ownerNode) detach(ownerNode);
			});
			managed_styles.clear();
		});
	}

	let current_component;

	/** @returns {void} */
	function set_current_component(component) {
		current_component = component;
	}

	const dirty_components = [];
	const binding_callbacks = [];

	let render_callbacks = [];

	const flush_callbacks = [];

	const resolved_promise = /* @__PURE__ */ Promise.resolve();

	let update_scheduled = false;

	/** @returns {void} */
	function schedule_update() {
		if (!update_scheduled) {
			update_scheduled = true;
			resolved_promise.then(flush);
		}
	}

	/** @returns {void} */
	function add_render_callback(fn) {
		render_callbacks.push(fn);
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

	/** @returns {void} */
	function flush() {
		// Do not reenter flush while dirty components are updated, as this can
		// result in an infinite loop. Instead, let the inner flush handle it.
		// Reentrancy is ok afterwards for bindings etc.
		if (flushidx !== 0) {
			return;
		}
		const saved_component = current_component;
		do {
			// first, call beforeUpdate functions
			// and update components
			try {
				while (flushidx < dirty_components.length) {
					const component = dirty_components[flushidx];
					flushidx++;
					set_current_component(component);
					update(component.$$);
				}
			} catch (e) {
				// reset dirty state to not end up in a deadlocked state and then rethrow
				dirty_components.length = 0;
				flushidx = 0;
				throw e;
			}
			set_current_component(null);
			dirty_components.length = 0;
			flushidx = 0;
			while (binding_callbacks.length) binding_callbacks.pop()();
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

	/** @returns {void} */
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

	/**
	 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
	 * @param {Function[]} fns
	 * @returns {void}
	 */
	function flush_render_callbacks(fns) {
		const filtered = [];
		const targets = [];
		render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
		targets.forEach((c) => c());
		render_callbacks = filtered;
	}

	/**
	 * @type {Promise<void> | null}
	 */
	let promise;

	/**
	 * @returns {Promise<void>}
	 */
	function wait() {
		if (!promise) {
			promise = Promise.resolve();
			promise.then(() => {
				promise = null;
			});
		}
		return promise;
	}

	/**
	 * @param {Element} node
	 * @param {INTRO | OUTRO | boolean} direction
	 * @param {'start' | 'end'} kind
	 * @returns {void}
	 */
	function dispatch(node, direction, kind) {
		node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
	}

	const outroing = new Set();

	/**
	 * @type {Outro}
	 */
	let outros;

	/**
	 * @returns {void} */
	function group_outros() {
		outros = {
			r: 0,
			c: [],
			p: outros // parent group
		};
	}

	/**
	 * @returns {void} */
	function check_outros() {
		if (!outros.r) {
			run_all(outros.c);
		}
		outros = outros.p;
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} [local]
	 * @returns {void}
	 */
	function transition_in(block, local) {
		if (block && block.i) {
			outroing.delete(block);
			block.i(local);
		}
	}

	/**
	 * @param {import('./private.js').Fragment} block
	 * @param {0 | 1} local
	 * @param {0 | 1} [detach]
	 * @param {() => void} [callback]
	 * @returns {void}
	 */
	function transition_out(block, local, detach, callback) {
		if (block && block.o) {
			if (outroing.has(block)) return;
			outroing.add(block);
			outros.c.push(() => {
				outroing.delete(block);
				if (callback) {
					if (detach) block.d(1);
					callback();
				}
			});
			block.o(local);
		} else if (callback) {
			callback();
		}
	}

	/**
	 * @type {import('../transition/public.js').TransitionConfig}
	 */
	const null_transition = { duration: 0 };

	/**
	 * @param {Element & ElementCSSInlineStyle} node
	 * @param {TransitionFn} fn
	 * @param {any} params
	 * @param {boolean} intro
	 * @returns {{ run(b: 0 | 1): void; end(): void; }}
	 */
	function create_bidirectional_transition(node, fn, params, intro) {
		/**
		 * @type {TransitionOptions} */
		const options = { direction: 'both' };
		let config = fn(node, params, options);
		let t = intro ? 0 : 1;

		/**
		 * @type {Program | null} */
		let running_program = null;

		/**
		 * @type {PendingProgram | null} */
		let pending_program = null;
		let animation_name = null;

		/** @type {boolean} */
		let original_inert_value;

		/**
		 * @returns {void} */
		function clear_animation() {
			if (animation_name) delete_rule(node, animation_name);
		}

		/**
		 * @param {PendingProgram} program
		 * @param {number} duration
		 * @returns {Program}
		 */
		function init(program, duration) {
			const d = /** @type {Program['d']} */ (program.b - t);
			duration *= Math.abs(d);
			return {
				a: t,
				b: program.b,
				d,
				duration,
				start: program.start,
				end: program.start + duration,
				group: program.group
			};
		}

		/**
		 * @param {INTRO | OUTRO} b
		 * @returns {void}
		 */
		function go(b) {
			const {
				delay = 0,
				duration = 300,
				easing = identity,
				tick = noop,
				css
			} = config || null_transition;

			/**
			 * @type {PendingProgram} */
			const program = {
				start: now() + delay,
				b
			};

			if (!b) {
				// @ts-ignore todo: improve typings
				program.group = outros;
				outros.r += 1;
			}

			if ('inert' in node) {
				if (b) {
					if (original_inert_value !== undefined) {
						// aborted/reversed outro — restore previous inert value
						node.inert = original_inert_value;
					}
				} else {
					original_inert_value = /** @type {HTMLElement} */ (node).inert;
					node.inert = true;
				}
			}

			if (running_program || pending_program) {
				pending_program = program;
			} else {
				// if this is an intro, and there's a delay, we need to do
				// an initial tick and/or apply CSS animation immediately
				if (css) {
					clear_animation();
					animation_name = create_rule(node, t, b, duration, delay, easing, css);
				}
				if (b) tick(0, 1);
				running_program = init(program, duration);
				add_render_callback(() => dispatch(node, b, 'start'));
				loop((now) => {
					if (pending_program && now > pending_program.start) {
						running_program = init(pending_program, duration);
						pending_program = null;
						dispatch(node, running_program.b, 'start');
						if (css) {
							clear_animation();
							animation_name = create_rule(
								node,
								t,
								running_program.b,
								running_program.duration,
								0,
								easing,
								config.css
							);
						}
					}
					if (running_program) {
						if (now >= running_program.end) {
							tick((t = running_program.b), 1 - t);
							dispatch(node, running_program.b, 'end');
							if (!pending_program) {
								// we're done
								if (running_program.b) {
									// intro — we can tidy up immediately
									clear_animation();
								} else {
									// outro — needs to be coordinated
									if (!--running_program.group.r) run_all(running_program.group.c);
								}
							}
							running_program = null;
						} else if (now >= running_program.start) {
							const p = now - running_program.start;
							t = running_program.a + running_program.d * easing(p / running_program.duration);
							tick(t, 1 - t);
						}
					}
					return !!(running_program || pending_program);
				});
			}
		}
		return {
			run(b) {
				if (is_function(config)) {
					wait().then(() => {
						const opts = { direction: b ? 'in' : 'out' };
						// @ts-ignore
						config = config(opts);
						go(b);
					});
				} else {
					go(b);
				}
			},
			end() {
				clear_animation();
				running_program = pending_program = null;
			}
		};
	}

	/** @typedef {1} INTRO */
	/** @typedef {0} OUTRO */
	/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
	/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

	/**
	 * @typedef {Object} Outro
	 * @property {number} r
	 * @property {Function[]} c
	 * @property {Object} p
	 */

	/**
	 * @typedef {Object} PendingProgram
	 * @property {number} start
	 * @property {INTRO|OUTRO} b
	 * @property {Outro} [group]
	 */

	/**
	 * @typedef {Object} Program
	 * @property {number} a
	 * @property {INTRO|OUTRO} b
	 * @property {1|-1} d
	 * @property {number} duration
	 * @property {number} start
	 * @property {number} end
	 * @property {Outro} [group]
	 */

	// general each functions:

	function ensure_array_like(array_like_or_iterator) {
		return array_like_or_iterator?.length !== undefined
			? array_like_or_iterator
			: Array.from(array_like_or_iterator);
	}

	// keyed each functions:

	/** @returns {void} */
	function destroy_block(block, lookup) {
		block.d(1);
		lookup.delete(block.key);
	}

	/** @returns {any[]} */
	function update_keyed_each(
		old_blocks,
		dirty,
		get_key,
		dynamic,
		ctx,
		list,
		lookup,
		node,
		destroy,
		create_each_block,
		next,
		get_context
	) {
		let o = old_blocks.length;
		let n = list.length;
		let i = o;
		const old_indexes = {};
		while (i--) old_indexes[old_blocks[i].key] = i;
		const new_blocks = [];
		const new_lookup = new Map();
		const deltas = new Map();
		const updates = [];
		i = n;
		while (i--) {
			const child_ctx = get_context(ctx, list, i);
			const key = get_key(child_ctx);
			let block = lookup.get(key);
			if (!block) {
				block = create_each_block(key, child_ctx);
				block.c();
			} else if (dynamic) {
				// defer updates until all the DOM shuffling is done
				updates.push(() => block.p(child_ctx, dirty));
			}
			new_lookup.set(key, (new_blocks[i] = block));
			if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
		}
		const will_move = new Set();
		const did_move = new Set();
		/** @returns {void} */
		function insert(block) {
			transition_in(block, 1);
			block.m(node, next);
			lookup.set(block.key, block);
			next = block.first;
			n--;
		}
		while (o && n) {
			const new_block = new_blocks[n - 1];
			const old_block = old_blocks[o - 1];
			const new_key = new_block.key;
			const old_key = old_block.key;
			if (new_block === old_block) {
				// do nothing
				next = new_block.first;
				o--;
				n--;
			} else if (!new_lookup.has(old_key)) {
				// remove old block
				destroy(old_block, lookup);
				o--;
			} else if (!lookup.has(new_key) || will_move.has(new_key)) {
				insert(new_block);
			} else if (did_move.has(old_key)) {
				o--;
			} else if (deltas.get(new_key) > deltas.get(old_key)) {
				did_move.add(new_key);
				insert(new_block);
			} else {
				will_move.add(old_key);
				o--;
			}
		}
		while (o--) {
			const old_block = old_blocks[o];
			if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
		}
		while (n) insert(new_blocks[n - 1]);
		run_all(updates);
		return new_blocks;
	}

	/** @returns {void} */
	function validate_each_keys(ctx, list, get_context, get_key) {
		const keys = new Map();
		for (let i = 0; i < list.length; i++) {
			const key = get_key(get_context(ctx, list, i));
			if (keys.has(key)) {
				let value = '';
				try {
					value = `with value '${String(key)}' `;
				} catch (e) {
					// can't stringify
				}
				throw new Error(
					`Cannot have duplicate keys in a keyed each: Keys at index ${keys.get(
					key
				)} and ${i} ${value}are duplicates`
				);
			}
			keys.set(key, i);
		}
	}

	/** @returns {void} */
	function mount_component(component, target, anchor) {
		const { fragment, after_update } = component.$$;
		fragment && fragment.m(target, anchor);
		// onMount happens before the initial afterUpdate
		add_render_callback(() => {
			const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
			// if the component was destroyed immediately
			// it will update the `$$.on_destroy` reference to `null`.
			// the destructured on_destroy may still reference to the old array
			if (component.$$.on_destroy) {
				component.$$.on_destroy.push(...new_on_destroy);
			} else {
				// Edge case - component was destroyed immediately,
				// most likely as a result of a binding initialising
				run_all(new_on_destroy);
			}
			component.$$.on_mount = [];
		});
		after_update.forEach(add_render_callback);
	}

	/** @returns {void} */
	function destroy_component(component, detaching) {
		const $$ = component.$$;
		if ($$.fragment !== null) {
			flush_render_callbacks($$.after_update);
			run_all($$.on_destroy);
			$$.fragment && $$.fragment.d(detaching);
			// TODO null out other refs, including component.$$ (but need to
			// preserve final state?)
			$$.on_destroy = $$.fragment = null;
			$$.ctx = [];
		}
	}

	/** @returns {void} */
	function make_dirty(component, i) {
		if (component.$$.dirty[0] === -1) {
			dirty_components.push(component);
			schedule_update();
			component.$$.dirty.fill(0);
		}
		component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
	}

	// TODO: Document the other params
	/**
	 * @param {SvelteComponent} component
	 * @param {import('./public.js').ComponentConstructorOptions} options
	 *
	 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
	 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
	 * This will be the `add_css` function from the compiled component.
	 *
	 * @returns {void}
	 */
	function init(
		component,
		options,
		instance,
		create_fragment,
		not_equal,
		props,
		append_styles = null,
		dirty = [-1]
	) {
		const parent_component = current_component;
		set_current_component(component);
		/** @type {import('./private.js').T$$} */
		const $$ = (component.$$ = {
			fragment: null,
			ctx: [],
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
		});
		append_styles && append_styles($$.root);
		let ready = false;
		$$.ctx = instance
			? instance(component, options.props || {}, (i, ret, ...rest) => {
					const value = rest.length ? rest[0] : ret;
					if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
						if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
						if (ready) make_dirty(component, i);
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
				// TODO: what is the correct type here?
				// @ts-expect-error
				const nodes = children(options.target);
				$$.fragment && $$.fragment.l(nodes);
				nodes.forEach(detach);
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				$$.fragment && $$.fragment.c();
			}
			if (options.intro) transition_in(component.$$.fragment);
			mount_component(component, options.target, options.anchor);
			flush();
		}
		set_current_component(parent_component);
	}

	/**
	 * Base class for Svelte components. Used when dev=false.
	 *
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 */
	class SvelteComponent {
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$ = undefined;
		/**
		 * ### PRIVATE API
		 *
		 * Do not use, may change at any time
		 *
		 * @type {any}
		 */
		$$set = undefined;

		/** @returns {void} */
		$destroy() {
			destroy_component(this, 1);
			this.$destroy = noop;
		}

		/**
		 * @template {Extract<keyof Events, string>} K
		 * @param {K} type
		 * @param {((e: Events[K]) => void) | null | undefined} callback
		 * @returns {() => void}
		 */
		$on(type, callback) {
			if (!is_function(callback)) {
				return noop;
			}
			const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
			callbacks.push(callback);
			return () => {
				const index = callbacks.indexOf(callback);
				if (index !== -1) callbacks.splice(index, 1);
			};
		}

		/**
		 * @param {Partial<Props>} props
		 * @returns {void}
		 */
		$set(props) {
			if (this.$$set && !is_empty(props)) {
				this.$$.skip_bound = true;
				this.$$set(props);
				this.$$.skip_bound = false;
			}
		}
	}

	/**
	 * @typedef {Object} CustomElementPropDefinition
	 * @property {string} [attribute]
	 * @property {boolean} [reflect]
	 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
	 */

	// generated during release, do not modify

	/**
	 * The current version, as set in package.json.
	 *
	 * https://svelte.dev/docs/svelte-compiler#svelte-version
	 * @type {string}
	 */
	const VERSION = '4.2.20';
	const PUBLIC_VERSION = '4';

	/**
	 * @template T
	 * @param {string} type
	 * @param {T} [detail]
	 * @returns {void}
	 */
	function dispatch_dev(type, detail) {
		document.dispatchEvent(custom_event(type, { version: VERSION, ...detail }, { bubbles: true }));
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @returns {void}
	 */
	function append_dev(target, node) {
		dispatch_dev('SvelteDOMInsert', { target, node });
		append(target, node);
	}

	/**
	 * @param {Node} target
	 * @param {Node} node
	 * @param {Node} [anchor]
	 * @returns {void}
	 */
	function insert_dev(target, node, anchor) {
		dispatch_dev('SvelteDOMInsert', { target, node, anchor });
		insert(target, node, anchor);
	}

	/**
	 * @param {Node} node
	 * @returns {void}
	 */
	function detach_dev(node) {
		dispatch_dev('SvelteDOMRemove', { node });
		detach(node);
	}

	/**
	 * @param {Node} node
	 * @param {string} event
	 * @param {EventListenerOrEventListenerObject} handler
	 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
	 * @param {boolean} [has_prevent_default]
	 * @param {boolean} [has_stop_propagation]
	 * @param {boolean} [has_stop_immediate_propagation]
	 * @returns {() => void}
	 */
	function listen_dev(
		node,
		event,
		handler,
		options,
		has_prevent_default,
		has_stop_propagation,
		has_stop_immediate_propagation
	) {
		const modifiers =
			options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
		if (has_prevent_default) modifiers.push('preventDefault');
		if (has_stop_propagation) modifiers.push('stopPropagation');
		if (has_stop_immediate_propagation) modifiers.push('stopImmediatePropagation');
		dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
		const dispose = listen(node, event, handler, options);
		return () => {
			dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
			dispose();
		};
	}

	/**
	 * @param {Element} node
	 * @param {string} attribute
	 * @param {string} [value]
	 * @returns {void}
	 */
	function attr_dev(node, attribute, value) {
		attr(node, attribute, value);
		if (value == null) dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
		else dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
	}

	/**
	 * @param {Element} node
	 * @param {string} property
	 * @param {any} [value]
	 * @returns {void}
	 */
	function prop_dev(node, property, value) {
		node[property] = value;
		dispatch_dev('SvelteDOMSetProperty', { node, property, value });
	}

	/**
	 * @param {Text} text
	 * @param {unknown} data
	 * @returns {void}
	 */
	function set_data_dev(text, data) {
		data = '' + data;
		if (text.data === data) return;
		dispatch_dev('SvelteDOMSetData', { node: text, data });
		text.data = /** @type {string} */ (data);
	}

	function ensure_array_like_dev(arg) {
		if (
			typeof arg !== 'string' &&
			!(arg && typeof arg === 'object' && 'length' in arg) &&
			!(typeof Symbol === 'function' && arg && Symbol.iterator in arg)
		) {
			throw new Error('{#each} only works with iterable values.');
		}
		return ensure_array_like(arg);
	}

	/**
	 * @returns {void} */
	function validate_slots(name, slot, keys) {
		for (const slot_key of Object.keys(slot)) {
			if (!~keys.indexOf(slot_key)) {
				console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
			}
		}
	}

	/**
	 * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
	 *
	 * Can be used to create strongly typed Svelte components.
	 *
	 * #### Example:
	 *
	 * You have component library on npm called `component-library`, from which
	 * you export a component called `MyComponent`. For Svelte+TypeScript users,
	 * you want to provide typings. Therefore you create a `index.d.ts`:
	 * ```ts
	 * import { SvelteComponent } from "svelte";
	 * export class MyComponent extends SvelteComponent<{foo: string}> {}
	 * ```
	 * Typing this makes it possible for IDEs like VS Code with the Svelte extension
	 * to provide intellisense and to use the component like this in a Svelte file
	 * with TypeScript:
	 * ```svelte
	 * <script lang="ts">
	 * 	import { MyComponent } from "component-library";
	 * </script>
	 * <MyComponent foo={'bar'} />
	 * ```
	 * @template {Record<string, any>} [Props=any]
	 * @template {Record<string, any>} [Events=any]
	 * @template {Record<string, any>} [Slots=any]
	 * @extends {SvelteComponent<Props, Events>}
	 */
	class SvelteComponentDev extends SvelteComponent {
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Props}
		 */
		$$prop_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Events}
		 */
		$$events_def;
		/**
		 * For type checking capabilities only.
		 * Does not exist at runtime.
		 * ### DO NOT USE!
		 *
		 * @type {Slots}
		 */
		$$slot_def;

		/** @param {import('./public.js').ComponentConstructorOptions<Props>} options */
		constructor(options) {
			if (!options || (!options.target && !options.$$inline)) {
				throw new Error("'target' is a required option");
			}
			super();
		}

		/** @returns {void} */
		$destroy() {
			super.$destroy();
			this.$destroy = () => {
				console.warn('Component was already destroyed'); // eslint-disable-line no-console
			};
		}

		/** @returns {void} */
		$capture_state() {}

		/** @returns {void} */
		$inject_state() {}
	}

	if (typeof window !== 'undefined')
		// @ts-ignore
		(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

	/*
	Adapted from https://github.com/mattdesl
	Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
	*/

	/**
	 * https://svelte.dev/docs/svelte-easing
	 * @param {number} t
	 * @returns {number}
	 */
	function cubicOut(t) {
		const f = t - 1.0;
		return f * f * f + 1.0;
	}

	/**
	 * Slides an element in and out.
	 *
	 * https://svelte.dev/docs/svelte-transition#slide
	 * @param {Element} node
	 * @param {import('./public').SlideParams} [params]
	 * @returns {import('./public').TransitionConfig}
	 */
	function slide(node, { delay = 0, duration = 400, easing = cubicOut, axis = 'y' } = {}) {
		const style = getComputedStyle(node);
		const opacity = +style.opacity;
		const primary_property = axis === 'y' ? 'height' : 'width';
		const primary_property_value = parseFloat(style[primary_property]);
		const secondary_properties = axis === 'y' ? ['top', 'bottom'] : ['left', 'right'];
		const capitalized_secondary_properties = secondary_properties.map(
			(e) => `${e[0].toUpperCase()}${e.slice(1)}`
		);
		const padding_start_value = parseFloat(style[`padding${capitalized_secondary_properties[0]}`]);
		const padding_end_value = parseFloat(style[`padding${capitalized_secondary_properties[1]}`]);
		const margin_start_value = parseFloat(style[`margin${capitalized_secondary_properties[0]}`]);
		const margin_end_value = parseFloat(style[`margin${capitalized_secondary_properties[1]}`]);
		const border_width_start_value = parseFloat(
			style[`border${capitalized_secondary_properties[0]}Width`]
		);
		const border_width_end_value = parseFloat(
			style[`border${capitalized_secondary_properties[1]}Width`]
		);
		return {
			delay,
			duration,
			easing,
			css: (t) =>
				'overflow: hidden;' +
				`opacity: ${Math.min(t * 20, 1) * opacity};` +
				`${primary_property}: ${t * primary_property_value}px;` +
				`padding-${secondary_properties[0]}: ${t * padding_start_value}px;` +
				`padding-${secondary_properties[1]}: ${t * padding_end_value}px;` +
				`margin-${secondary_properties[0]}: ${t * margin_start_value}px;` +
				`margin-${secondary_properties[1]}: ${t * margin_end_value}px;` +
				`border-${secondary_properties[0]}-width: ${t * border_width_start_value}px;` +
				`border-${secondary_properties[1]}-width: ${t * border_width_end_value}px;`
		};
	}

	const subscriber_queue = [];

	/**
	 * Create a `Writable` store that allows both updating and reading by subscription.
	 *
	 * https://svelte.dev/docs/svelte-store#writable
	 * @template T
	 * @param {T} [value] initial value
	 * @param {import('./public.js').StartStopNotifier<T>} [start]
	 * @returns {import('./public.js').Writable<T>}
	 */
	function writable(value, start = noop) {
		/** @type {import('./public.js').Unsubscriber} */
		let stop;
		/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
		const subscribers = new Set();
		/** @param {T} new_value
		 * @returns {void}
		 */
		function set(new_value) {
			if (safe_not_equal(value, new_value)) {
				value = new_value;
				if (stop) {
					// store is ready
					const run_queue = !subscriber_queue.length;
					for (const subscriber of subscribers) {
						subscriber[1]();
						subscriber_queue.push(subscriber, value);
					}
					if (run_queue) {
						for (let i = 0; i < subscriber_queue.length; i += 2) {
							subscriber_queue[i][0](subscriber_queue[i + 1]);
						}
						subscriber_queue.length = 0;
					}
				}
			}
		}

		/**
		 * @param {import('./public.js').Updater<T>} fn
		 * @returns {void}
		 */
		function update(fn) {
			set(fn(value));
		}

		/**
		 * @param {import('./public.js').Subscriber<T>} run
		 * @param {import('./private.js').Invalidator<T>} [invalidate]
		 * @returns {import('./public.js').Unsubscriber}
		 */
		function subscribe(run, invalidate = noop) {
			/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
			const subscriber = [run, invalidate];
			subscribers.add(subscriber);
			if (subscribers.size === 1) {
				stop = start(set, update) || noop;
			}
			run(value);
			return () => {
				subscribers.delete(subscriber);
				if (subscribers.size === 0 && stop) {
					stop();
					stop = null;
				}
			};
		}
		return { set, update, subscribe };
	}

	var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function getDefaultExportFromCjs (x) {
		return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
	}

	function getAugmentedNamespace(n) {
	  if (n.__esModule) return n;
	  var f = n.default;
		if (typeof f == "function") {
			var a = function a () {
				if (this instanceof a) {
					var args = [null];
					args.push.apply(args, arguments);
					var Ctor = Function.bind.apply(f, args);
					return new Ctor();
				}
				return f.apply(this, arguments);
			};
			a.prototype = f.prototype;
	  } else a = {};
	  Object.defineProperty(a, '__esModule', {value: true});
		Object.keys(n).forEach(function (k) {
			var d = Object.getOwnPropertyDescriptor(n, k);
			Object.defineProperty(a, k, d.get ? d : {
				enumerable: true,
				get: function () {
					return n[k];
				}
			});
		});
		return a;
	}

	var sha256 = {exports: {}};

	function commonjsRequire(path) {
		throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
	}

	var core = {exports: {}};

	var _nodeResolve_empty = {};

	var _nodeResolve_empty$1 = /*#__PURE__*/Object.freeze({
		__proto__: null,
		default: _nodeResolve_empty
	});

	var require$$0 = /*@__PURE__*/getAugmentedNamespace(_nodeResolve_empty$1);

	var hasRequiredCore;

	function requireCore () {
		if (hasRequiredCore) return core.exports;
		hasRequiredCore = 1;
		(function (module, exports) {
	(function (root, factory) {
				{
					// CommonJS
					module.exports = factory();
				}
			}(commonjsGlobal, function () {

				/*globals window, global, require*/

				/**
				 * CryptoJS core components.
				 */
				var CryptoJS = CryptoJS || (function (Math, undefined$1) {

				    var crypto;

				    // Native crypto from window (Browser)
				    if (typeof window !== 'undefined' && window.crypto) {
				        crypto = window.crypto;
				    }

				    // Native crypto in web worker (Browser)
				    if (typeof self !== 'undefined' && self.crypto) {
				        crypto = self.crypto;
				    }

				    // Native crypto from worker
				    if (typeof globalThis !== 'undefined' && globalThis.crypto) {
				        crypto = globalThis.crypto;
				    }

				    // Native (experimental IE 11) crypto from window (Browser)
				    if (!crypto && typeof window !== 'undefined' && window.msCrypto) {
				        crypto = window.msCrypto;
				    }

				    // Native crypto from global (NodeJS)
				    if (!crypto && typeof commonjsGlobal !== 'undefined' && commonjsGlobal.crypto) {
				        crypto = commonjsGlobal.crypto;
				    }

				    // Native crypto import via require (NodeJS)
				    if (!crypto && typeof commonjsRequire === 'function') {
				        try {
				            crypto = require$$0;
				        } catch (err) {}
				    }

				    /*
				     * Cryptographically secure pseudorandom number generator
				     *
				     * As Math.random() is cryptographically not safe to use
				     */
				    var cryptoSecureRandomInt = function () {
				        if (crypto) {
				            // Use getRandomValues method (Browser)
				            if (typeof crypto.getRandomValues === 'function') {
				                try {
				                    return crypto.getRandomValues(new Uint32Array(1))[0];
				                } catch (err) {}
				            }

				            // Use randomBytes method (NodeJS)
				            if (typeof crypto.randomBytes === 'function') {
				                try {
				                    return crypto.randomBytes(4).readInt32LE();
				                } catch (err) {}
				            }
				        }

				        throw new Error('Native crypto module could not be used to get secure random number.');
				    };

				    /*
				     * Local polyfill of Object.create

				     */
				    var create = Object.create || (function () {
				        function F() {}

				        return function (obj) {
				            var subtype;

				            F.prototype = obj;

				            subtype = new F();

				            F.prototype = null;

				            return subtype;
				        };
				    }());

				    /**
				     * CryptoJS namespace.
				     */
				    var C = {};

				    /**
				     * Library namespace.
				     */
				    var C_lib = C.lib = {};

				    /**
				     * Base object for prototypal inheritance.
				     */
				    var Base = C_lib.Base = (function () {


				        return {
				            /**
				             * Creates a new object that inherits from this object.
				             *
				             * @param {Object} overrides Properties to copy into the new object.
				             *
				             * @return {Object} The new object.
				             *
				             * @static
				             *
				             * @example
				             *
				             *     var MyType = CryptoJS.lib.Base.extend({
				             *         field: 'value',
				             *
				             *         method: function () {
				             *         }
				             *     });
				             */
				            extend: function (overrides) {
				                // Spawn
				                var subtype = create(this);

				                // Augment
				                if (overrides) {
				                    subtype.mixIn(overrides);
				                }

				                // Create default initializer
				                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
				                    subtype.init = function () {
				                        subtype.$super.init.apply(this, arguments);
				                    };
				                }

				                // Initializer's prototype is the subtype object
				                subtype.init.prototype = subtype;

				                // Reference supertype
				                subtype.$super = this;

				                return subtype;
				            },

				            /**
				             * Extends this object and runs the init method.
				             * Arguments to create() will be passed to init().
				             *
				             * @return {Object} The new object.
				             *
				             * @static
				             *
				             * @example
				             *
				             *     var instance = MyType.create();
				             */
				            create: function () {
				                var instance = this.extend();
				                instance.init.apply(instance, arguments);

				                return instance;
				            },

				            /**
				             * Initializes a newly created object.
				             * Override this method to add some logic when your objects are created.
				             *
				             * @example
				             *
				             *     var MyType = CryptoJS.lib.Base.extend({
				             *         init: function () {
				             *             // ...
				             *         }
				             *     });
				             */
				            init: function () {
				            },

				            /**
				             * Copies properties into this object.
				             *
				             * @param {Object} properties The properties to mix in.
				             *
				             * @example
				             *
				             *     MyType.mixIn({
				             *         field: 'value'
				             *     });
				             */
				            mixIn: function (properties) {
				                for (var propertyName in properties) {
				                    if (properties.hasOwnProperty(propertyName)) {
				                        this[propertyName] = properties[propertyName];
				                    }
				                }

				                // IE won't copy toString using the loop above
				                if (properties.hasOwnProperty('toString')) {
				                    this.toString = properties.toString;
				                }
				            },

				            /**
				             * Creates a copy of this object.
				             *
				             * @return {Object} The clone.
				             *
				             * @example
				             *
				             *     var clone = instance.clone();
				             */
				            clone: function () {
				                return this.init.prototype.extend(this);
				            }
				        };
				    }());

				    /**
				     * An array of 32-bit words.
				     *
				     * @property {Array} words The array of 32-bit words.
				     * @property {number} sigBytes The number of significant bytes in this word array.
				     */
				    var WordArray = C_lib.WordArray = Base.extend({
				        /**
				         * Initializes a newly created word array.
				         *
				         * @param {Array} words (Optional) An array of 32-bit words.
				         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
				         *
				         * @example
				         *
				         *     var wordArray = CryptoJS.lib.WordArray.create();
				         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
				         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
				         */
				        init: function (words, sigBytes) {
				            words = this.words = words || [];

				            if (sigBytes != undefined$1) {
				                this.sigBytes = sigBytes;
				            } else {
				                this.sigBytes = words.length * 4;
				            }
				        },

				        /**
				         * Converts this word array to a string.
				         *
				         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
				         *
				         * @return {string} The stringified word array.
				         *
				         * @example
				         *
				         *     var string = wordArray + '';
				         *     var string = wordArray.toString();
				         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
				         */
				        toString: function (encoder) {
				            return (encoder || Hex).stringify(this);
				        },

				        /**
				         * Concatenates a word array to this word array.
				         *
				         * @param {WordArray} wordArray The word array to append.
				         *
				         * @return {WordArray} This word array.
				         *
				         * @example
				         *
				         *     wordArray1.concat(wordArray2);
				         */
				        concat: function (wordArray) {
				            // Shortcuts
				            var thisWords = this.words;
				            var thatWords = wordArray.words;
				            var thisSigBytes = this.sigBytes;
				            var thatSigBytes = wordArray.sigBytes;

				            // Clamp excess bits
				            this.clamp();

				            // Concat
				            if (thisSigBytes % 4) {
				                // Copy one byte at a time
				                for (var i = 0; i < thatSigBytes; i++) {
				                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
				                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
				                }
				            } else {
				                // Copy one word at a time
				                for (var j = 0; j < thatSigBytes; j += 4) {
				                    thisWords[(thisSigBytes + j) >>> 2] = thatWords[j >>> 2];
				                }
				            }
				            this.sigBytes += thatSigBytes;

				            // Chainable
				            return this;
				        },

				        /**
				         * Removes insignificant bits.
				         *
				         * @example
				         *
				         *     wordArray.clamp();
				         */
				        clamp: function () {
				            // Shortcuts
				            var words = this.words;
				            var sigBytes = this.sigBytes;

				            // Clamp
				            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
				            words.length = Math.ceil(sigBytes / 4);
				        },

				        /**
				         * Creates a copy of this word array.
				         *
				         * @return {WordArray} The clone.
				         *
				         * @example
				         *
				         *     var clone = wordArray.clone();
				         */
				        clone: function () {
				            var clone = Base.clone.call(this);
				            clone.words = this.words.slice(0);

				            return clone;
				        },

				        /**
				         * Creates a word array filled with random bytes.
				         *
				         * @param {number} nBytes The number of random bytes to generate.
				         *
				         * @return {WordArray} The random word array.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var wordArray = CryptoJS.lib.WordArray.random(16);
				         */
				        random: function (nBytes) {
				            var words = [];

				            for (var i = 0; i < nBytes; i += 4) {
				                words.push(cryptoSecureRandomInt());
				            }

				            return new WordArray.init(words, nBytes);
				        }
				    });

				    /**
				     * Encoder namespace.
				     */
				    var C_enc = C.enc = {};

				    /**
				     * Hex encoding strategy.
				     */
				    var Hex = C_enc.Hex = {
				        /**
				         * Converts a word array to a hex string.
				         *
				         * @param {WordArray} wordArray The word array.
				         *
				         * @return {string} The hex string.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
				         */
				        stringify: function (wordArray) {
				            // Shortcuts
				            var words = wordArray.words;
				            var sigBytes = wordArray.sigBytes;

				            // Convert
				            var hexChars = [];
				            for (var i = 0; i < sigBytes; i++) {
				                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
				                hexChars.push((bite >>> 4).toString(16));
				                hexChars.push((bite & 0x0f).toString(16));
				            }

				            return hexChars.join('');
				        },

				        /**
				         * Converts a hex string to a word array.
				         *
				         * @param {string} hexStr The hex string.
				         *
				         * @return {WordArray} The word array.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
				         */
				        parse: function (hexStr) {
				            // Shortcut
				            var hexStrLength = hexStr.length;

				            // Convert
				            var words = [];
				            for (var i = 0; i < hexStrLength; i += 2) {
				                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
				            }

				            return new WordArray.init(words, hexStrLength / 2);
				        }
				    };

				    /**
				     * Latin1 encoding strategy.
				     */
				    var Latin1 = C_enc.Latin1 = {
				        /**
				         * Converts a word array to a Latin1 string.
				         *
				         * @param {WordArray} wordArray The word array.
				         *
				         * @return {string} The Latin1 string.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
				         */
				        stringify: function (wordArray) {
				            // Shortcuts
				            var words = wordArray.words;
				            var sigBytes = wordArray.sigBytes;

				            // Convert
				            var latin1Chars = [];
				            for (var i = 0; i < sigBytes; i++) {
				                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
				                latin1Chars.push(String.fromCharCode(bite));
				            }

				            return latin1Chars.join('');
				        },

				        /**
				         * Converts a Latin1 string to a word array.
				         *
				         * @param {string} latin1Str The Latin1 string.
				         *
				         * @return {WordArray} The word array.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
				         */
				        parse: function (latin1Str) {
				            // Shortcut
				            var latin1StrLength = latin1Str.length;

				            // Convert
				            var words = [];
				            for (var i = 0; i < latin1StrLength; i++) {
				                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
				            }

				            return new WordArray.init(words, latin1StrLength);
				        }
				    };

				    /**
				     * UTF-8 encoding strategy.
				     */
				    var Utf8 = C_enc.Utf8 = {
				        /**
				         * Converts a word array to a UTF-8 string.
				         *
				         * @param {WordArray} wordArray The word array.
				         *
				         * @return {string} The UTF-8 string.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
				         */
				        stringify: function (wordArray) {
				            try {
				                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
				            } catch (e) {
				                throw new Error('Malformed UTF-8 data');
				            }
				        },

				        /**
				         * Converts a UTF-8 string to a word array.
				         *
				         * @param {string} utf8Str The UTF-8 string.
				         *
				         * @return {WordArray} The word array.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
				         */
				        parse: function (utf8Str) {
				            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
				        }
				    };

				    /**
				     * Abstract buffered block algorithm template.
				     *
				     * The property blockSize must be implemented in a concrete subtype.
				     *
				     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
				     */
				    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
				        /**
				         * Resets this block algorithm's data buffer to its initial state.
				         *
				         * @example
				         *
				         *     bufferedBlockAlgorithm.reset();
				         */
				        reset: function () {
				            // Initial values
				            this._data = new WordArray.init();
				            this._nDataBytes = 0;
				        },

				        /**
				         * Adds new data to this block algorithm's buffer.
				         *
				         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
				         *
				         * @example
				         *
				         *     bufferedBlockAlgorithm._append('data');
				         *     bufferedBlockAlgorithm._append(wordArray);
				         */
				        _append: function (data) {
				            // Convert string to WordArray, else assume WordArray already
				            if (typeof data == 'string') {
				                data = Utf8.parse(data);
				            }

				            // Append
				            this._data.concat(data);
				            this._nDataBytes += data.sigBytes;
				        },

				        /**
				         * Processes available data blocks.
				         *
				         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
				         *
				         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
				         *
				         * @return {WordArray} The processed data.
				         *
				         * @example
				         *
				         *     var processedData = bufferedBlockAlgorithm._process();
				         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
				         */
				        _process: function (doFlush) {
				            var processedWords;

				            // Shortcuts
				            var data = this._data;
				            var dataWords = data.words;
				            var dataSigBytes = data.sigBytes;
				            var blockSize = this.blockSize;
				            var blockSizeBytes = blockSize * 4;

				            // Count blocks ready
				            var nBlocksReady = dataSigBytes / blockSizeBytes;
				            if (doFlush) {
				                // Round up to include partial blocks
				                nBlocksReady = Math.ceil(nBlocksReady);
				            } else {
				                // Round down to include only full blocks,
				                // less the number of blocks that must remain in the buffer
				                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
				            }

				            // Count words ready
				            var nWordsReady = nBlocksReady * blockSize;

				            // Count bytes ready
				            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

				            // Process blocks
				            if (nWordsReady) {
				                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
				                    // Perform concrete-algorithm logic
				                    this._doProcessBlock(dataWords, offset);
				                }

				                // Remove processed words
				                processedWords = dataWords.splice(0, nWordsReady);
				                data.sigBytes -= nBytesReady;
				            }

				            // Return processed words
				            return new WordArray.init(processedWords, nBytesReady);
				        },

				        /**
				         * Creates a copy of this object.
				         *
				         * @return {Object} The clone.
				         *
				         * @example
				         *
				         *     var clone = bufferedBlockAlgorithm.clone();
				         */
				        clone: function () {
				            var clone = Base.clone.call(this);
				            clone._data = this._data.clone();

				            return clone;
				        },

				        _minBufferSize: 0
				    });

				    /**
				     * Abstract hasher template.
				     *
				     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
				     */
				    C_lib.Hasher = BufferedBlockAlgorithm.extend({
				        /**
				         * Configuration options.
				         */
				        cfg: Base.extend(),

				        /**
				         * Initializes a newly created hasher.
				         *
				         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
				         *
				         * @example
				         *
				         *     var hasher = CryptoJS.algo.SHA256.create();
				         */
				        init: function (cfg) {
				            // Apply config defaults
				            this.cfg = this.cfg.extend(cfg);

				            // Set initial values
				            this.reset();
				        },

				        /**
				         * Resets this hasher to its initial state.
				         *
				         * @example
				         *
				         *     hasher.reset();
				         */
				        reset: function () {
				            // Reset data buffer
				            BufferedBlockAlgorithm.reset.call(this);

				            // Perform concrete-hasher logic
				            this._doReset();
				        },

				        /**
				         * Updates this hasher with a message.
				         *
				         * @param {WordArray|string} messageUpdate The message to append.
				         *
				         * @return {Hasher} This hasher.
				         *
				         * @example
				         *
				         *     hasher.update('message');
				         *     hasher.update(wordArray);
				         */
				        update: function (messageUpdate) {
				            // Append
				            this._append(messageUpdate);

				            // Update the hash
				            this._process();

				            // Chainable
				            return this;
				        },

				        /**
				         * Finalizes the hash computation.
				         * Note that the finalize operation is effectively a destructive, read-once operation.
				         *
				         * @param {WordArray|string} messageUpdate (Optional) A final message update.
				         *
				         * @return {WordArray} The hash.
				         *
				         * @example
				         *
				         *     var hash = hasher.finalize();
				         *     var hash = hasher.finalize('message');
				         *     var hash = hasher.finalize(wordArray);
				         */
				        finalize: function (messageUpdate) {
				            // Final message update
				            if (messageUpdate) {
				                this._append(messageUpdate);
				            }

				            // Perform concrete-hasher logic
				            var hash = this._doFinalize();

				            return hash;
				        },

				        blockSize: 512/32,

				        /**
				         * Creates a shortcut function to a hasher's object interface.
				         *
				         * @param {Hasher} hasher The hasher to create a helper for.
				         *
				         * @return {Function} The shortcut function.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
				         */
				        _createHelper: function (hasher) {
				            return function (message, cfg) {
				                return new hasher.init(cfg).finalize(message);
				            };
				        },

				        /**
				         * Creates a shortcut function to the HMAC's object interface.
				         *
				         * @param {Hasher} hasher The hasher to use in this HMAC helper.
				         *
				         * @return {Function} The shortcut function.
				         *
				         * @static
				         *
				         * @example
				         *
				         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
				         */
				        _createHmacHelper: function (hasher) {
				            return function (message, key) {
				                return new C_algo.HMAC.init(hasher, key).finalize(message);
				            };
				        }
				    });

				    /**
				     * Algorithm namespace.
				     */
				    var C_algo = C.algo = {};

				    return C;
				}(Math));


				return CryptoJS;

			})); 
		} (core));
		return core.exports;
	}

	(function (module, exports) {
	(function (root, factory) {
			{
				// CommonJS
				module.exports = factory(requireCore());
			}
		}(commonjsGlobal, function (CryptoJS) {

			(function (Math) {
			    // Shortcuts
			    var C = CryptoJS;
			    var C_lib = C.lib;
			    var WordArray = C_lib.WordArray;
			    var Hasher = C_lib.Hasher;
			    var C_algo = C.algo;

			    // Initialization and round constants tables
			    var H = [];
			    var K = [];

			    // Compute constants
			    (function () {
			        function isPrime(n) {
			            var sqrtN = Math.sqrt(n);
			            for (var factor = 2; factor <= sqrtN; factor++) {
			                if (!(n % factor)) {
			                    return false;
			                }
			            }

			            return true;
			        }

			        function getFractionalBits(n) {
			            return ((n - (n | 0)) * 0x100000000) | 0;
			        }

			        var n = 2;
			        var nPrime = 0;
			        while (nPrime < 64) {
			            if (isPrime(n)) {
			                if (nPrime < 8) {
			                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
			                }
			                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

			                nPrime++;
			            }

			            n++;
			        }
			    }());

			    // Reusable object
			    var W = [];

			    /**
			     * SHA-256 hash algorithm.
			     */
			    var SHA256 = C_algo.SHA256 = Hasher.extend({
			        _doReset: function () {
			            this._hash = new WordArray.init(H.slice(0));
			        },

			        _doProcessBlock: function (M, offset) {
			            // Shortcut
			            var H = this._hash.words;

			            // Working variables
			            var a = H[0];
			            var b = H[1];
			            var c = H[2];
			            var d = H[3];
			            var e = H[4];
			            var f = H[5];
			            var g = H[6];
			            var h = H[7];

			            // Computation
			            for (var i = 0; i < 64; i++) {
			                if (i < 16) {
			                    W[i] = M[offset + i] | 0;
			                } else {
			                    var gamma0x = W[i - 15];
			                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
			                                  ((gamma0x << 14) | (gamma0x >>> 18)) ^
			                                   (gamma0x >>> 3);

			                    var gamma1x = W[i - 2];
			                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
			                                  ((gamma1x << 13) | (gamma1x >>> 19)) ^
			                                   (gamma1x >>> 10);

			                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
			                }

			                var ch  = (e & f) ^ (~e & g);
			                var maj = (a & b) ^ (a & c) ^ (b & c);

			                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
			                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

			                var t1 = h + sigma1 + ch + K[i] + W[i];
			                var t2 = sigma0 + maj;

			                h = g;
			                g = f;
			                f = e;
			                e = (d + t1) | 0;
			                d = c;
			                c = b;
			                b = a;
			                a = (t1 + t2) | 0;
			            }

			            // Intermediate hash value
			            H[0] = (H[0] + a) | 0;
			            H[1] = (H[1] + b) | 0;
			            H[2] = (H[2] + c) | 0;
			            H[3] = (H[3] + d) | 0;
			            H[4] = (H[4] + e) | 0;
			            H[5] = (H[5] + f) | 0;
			            H[6] = (H[6] + g) | 0;
			            H[7] = (H[7] + h) | 0;
			        },

			        _doFinalize: function () {
			            // Shortcuts
			            var data = this._data;
			            var dataWords = data.words;

			            var nBitsTotal = this._nDataBytes * 8;
			            var nBitsLeft = data.sigBytes * 8;

			            // Add padding
			            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
			            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
			            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
			            data.sigBytes = dataWords.length * 4;

			            // Hash final blocks
			            this._process();

			            // Return final computed hash
			            return this._hash;
			        },

			        clone: function () {
			            var clone = Hasher.clone.call(this);
			            clone._hash = this._hash.clone();

			            return clone;
			        }
			    });

			    /**
			     * Shortcut function to the hasher's object interface.
			     *
			     * @param {WordArray|string} message The message to hash.
			     *
			     * @return {WordArray} The hash.
			     *
			     * @static
			     *
			     * @example
			     *
			     *     var hash = CryptoJS.SHA256('message');
			     *     var hash = CryptoJS.SHA256(wordArray);
			     */
			    C.SHA256 = Hasher._createHelper(SHA256);

			    /**
			     * Shortcut function to the HMAC's object interface.
			     *
			     * @param {WordArray|string} message The message to hash.
			     * @param {WordArray|string} key The secret key.
			     *
			     * @return {WordArray} The HMAC.
			     *
			     * @static
			     *
			     * @example
			     *
			     *     var hmac = CryptoJS.HmacSHA256(message, key);
			     */
			    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
			}(Math));


			return CryptoJS.SHA256;

		})); 
	} (sha256));

	var sha256Exports = sha256.exports;
	var SHA256 = /*@__PURE__*/getDefaultExportFromCjs(sha256Exports);

	// ==========================
	// 🍌 Upgrade List
	// ==========================
	const upgradesList = [
	  {
	    name: "+1 per click",
	    cost: 10,
	    value: 1,
	    label: "+1 per click",
	    type: "click",
	  },
	  {
	    name: "+5 per click",
	    cost: 75,
	    value: 5,
	    label: "+5 per click",
	    type: "click",
	  },
	  {
	    name: "+10 per click",
	    cost: 250,
	    value: 10,
	    label: "+10 per click",
	    type: "click",
	  },
	  {
	    name: "+50 per click",
	    cost: 1000,
	    value: 50,
	    label: "+50 per click",
	    type: "click",
	  },
	  {
	    name: "+100 per click",
	    cost: 5000,
	    value: 100,
	    label: "+100 per click",
	    type: "click",
	  },

	  {
	    name: "Auto Clicker +100/s",
	    cost: 24000,
	    value: 100,
	    label: "+100 Auto Clicker",
	    type: "auto",
	  },
	  {
	    name: "Auto Clicker +500/s",
	    cost: 100000,
	    value: 500,
	    label: "+500 Auto Clicker",
	    type: "auto",
	  },

	  {
	    name: "Super Auto Clicker +1k/s",
	    cost: 250000,
	    value: 1000,
	    label: "Super Auto Clicker",
	    type: "auto",
	  },
	  {
	    name: "Golden Auto Clicker +10k/s",
	    cost: 850000,
	    value: 10000,
	    label: "Golden Auto Clicker",
	    type: "auto",
	  },

	  {
	    name: "Mega Clicks +100k per click",
	    cost: 5000000,
	    value: 100000,
	    label: "Mega Clicks",
	    type: "click",
	  },

	  {
	    name: "Banana Magnet (x2 Clicks)",
	    cost: 5000000,
	    value: 2,
	    label: "Banana Magnet",
	    type: "multiplier",
	  },
	  {
	    name: "Golden Clicks (x5 Clicks)",
	    cost: 7000000,
	    value: 5,
	    label: "Golden Clicks",
	    type: "multiplier",
	  },

	  {
	    name: "Banana Factory +200k/s",
	    cost: 20000000,
	    value: 200000,
	    label: "Banana Factory",
	    type: "auto",
	  },
	  {
	    name: "Ultra Auto Clicker +20M/s",
	    cost: 75000000,
	    value: 20000000,
	    label: "Ultra Auto Clicker",
	    type: "auto",
	  },
	  {
	    name: "OP Banana God +500M/s",
	    cost: 15000000000000,
	    value: 50000000,
	    label: "Banana God",
	    type: "auto",
	  },
	];

	// ==========================
	// 🍌 Default Player Save
	// ==========================
	const defaultData = {
	  bananas: 0,
	  bananasPerClick: 1,
	  baseBananasPerClick: 1,
	  baseAutoClickPower: 0,
	  multiplier: 0,
	  autoClickPower: 0,
	  soundFX: true,
	  music: true,
	  upgrades: [],
	  activeEffects: {},
	};

	// ==========================
	// 🍌 BananaGuard Hashing
	// ==========================
	function peelBanana$1(data) {
	  return SHA256(JSON.stringify(data)).toString();
	}

	// ==========================
	// 🍌 Load with BananaGuard
	// ==========================
	function BananaGuardLoad() {
	  try {
	    const raw = localStorage.getItem("bananaClicker");
	    if (!raw) return defaultData;

	    const parsed = JSON.parse(raw);

	    // Check for missing fields
	    if (!parsed.data || !parsed.bananaPeel) {
	      console.warn(
	        "%c[🍌 BananaGuard] Missing fields in saved data. Resetting save!",
	        "color:red;font-size:16px",
	      );
	      return defaultData;
	    }

	    // Validate integrity
	    const expected = peelBanana$1(parsed.data);
	    if (expected !== parsed.bananaPeel) {
	      console.warn(
	        "%c[🍌 BananaGuard] Tampering detected. Resetting save!",
	        "color:red;font-size:16px",
	      );
	      return defaultData;
	    }

	    // Ensure the saved data has all required fields
	    const requiredFields = [
	      "bananas",
	      "bananasPerClick",
	      "baseBananasPerClick",
	      "baseAutoClickPower",
	      "multiplier",
	      "autoClickPower",
	      "soundFX",
	      "music",
	      "upgrades",
	      "activeEffects",
	    ];
	    const hasAllFields = requiredFields.every((field) => field in parsed.data);

	    if (!hasAllFields) {
	      console.warn(
	        "%c[🍌 BananaGuard] Saved data is missing required fields. Resetting save!",
	        "color:red;font-size:16px",
	      );
	      return defaultData;
	    }

	    // Verified
	    console.log(
	      "%c[🛡️ BananaGuard] Save integrity verified.",
	      "color:#7CFC00;font-size:14px",
	    );

	    return parsed.data;
	  } catch (err) {
	    console.error("BananaGuard failed to load:", err);
	    return defaultData;
	  }
	}

	// ==========================
	// 🍌 Save with BananaGuard
	// ==========================
	function BananaGuardSave(data) {
	  try {
	    // Ensure the data has all required fields
	    const requiredFields = [
	      "bananas",
	      "bananasPerClick",
	      "baseBananasPerClick",
	      "baseAutoClickPower",
	      "multiplier",
	      "autoClickPower",
	      "soundFX",
	      "music",
	      "upgrades",
	      "activeEffects",
	    ];
	    const hasAllFields = requiredFields.every((field) => field in data);

	    if (!hasAllFields) {
	      console.warn(
	        "%c[🍌 BananaGuard] Data is missing required fields. Not saving!",
	        "color:red;font-size:16px",
	      );
	      return;
	    }

	    const sealedBanana = {
	      data,
	      bananaPeel: peelBanana$1(data),
	    };

	    localStorage.setItem("bananaClicker", JSON.stringify(sealedBanana));
	  } catch (err) {
	    console.error("BananaGuard failed to save:", err);
	  }
	}

	// ==========================
	// 🍌 Writable Store
	// ==========================
	const playerData = writable(BananaGuardLoad());

	playerData.subscribe((data) => BananaGuardSave(data));

	const SAVE_KEY = "bananaClicker";
	const HONEYPOT_KEY = "bananaClicker_cheat_detect";
	const HONEYPOT_VALUE = "DO_NOT_EDIT";

	function peelBanana(data) {
	    return SHA256(JSON.stringify(data)).toString();
	}

	function deployHoneyPot() {
	    if (localStorage.getItem(HONEYPOT_KEY) !== HONEYPOT_VALUE) {
	        localStorage.setItem(HONEYPOT_KEY, HONEYPOT_VALUE);
	    }
	}

	function checkHoneyPot() {
	    const trap = localStorage.getItem(HONEYPOT_KEY);
	    if (trap !== HONEYPOT_VALUE) {
	        console.warn("%c[🍌 BananaGuard] Honeypot triggered: Cheater detected!", "color:red;font-size:22px");
	        return true;
	    }
	    return false;
	}

	function detectDevtools() {
	    const threshold = 100;

	    setInterval(() => {
	        const start = performance.now();
	        debugger; 
	        if (performance.now() - start > threshold) {
	            console.warn("%c[🍌 BananaGuard] DevTools detected!", "color:orange;font-size:18px");
	        }
	    }, 800);
	}

	function listenToStorage() {
	    window.addEventListener("storage", (event) => {
	        if (event.key === SAVE_KEY) {
	            console.warn("%c[🍌 BananaGuard] External save modification detected!", "color:red;font-size:18px");
	            location.reload();
	        }
	    });
	}

	function liveBananaScan() {
	    setInterval(() => {
	        try {
	            const raw = localStorage.getItem(SAVE_KEY);
	            if (!raw) return;

	            const parsed = JSON.parse(raw);

	            if (peelBanana(parsed.data) !== parsed.bananaPeel) {
	                console.warn("%c[🍌 BananaGuard] Live tamper detected!", "color:red;font-size:20px");
	                localStorage.removeItem(SAVE_KEY);
	                localStorage.removeItem(HONEYPOT_KEY);
	                location.reload();
	            }

	            if (checkHoneyPot()) {
	                localStorage.removeItem(SAVE_KEY);
	                localStorage.removeItem(HONEYPOT_KEY);
	                location.reload();
	            }

	        } catch (e) {
	            console.error("[🍌 BananaGuard] LiveScan error:", e);
	        }
	    }, 1500);
	}

	function bananaBanner() {
	    console.log("%c 🍌 BananaGuard Activated", "color:yellow;font-size:26px;font-weight:bold;");
	    console.log("%c[🛡️ BananaGuard] Status: Running...", "color:#ffcc00;font-size:16px");
	    console.log("%cKeep your bananas safe from cheaters 😎", "color:#ffaa00;font-size:14px");
	}

	function startBananaGuard() {
	    bananaBanner();

	    deployHoneyPot();
	    detectDevtools();
	    listenToStorage();
	    liveBananaScan();
	}

	var name = "bananaclicker";
	var version = "1.2.5";
	var type = "module";
	var scripts = {
		build: "rollup -c",
		dev: "rollup -c -w",
		start: "sirv public --no-clear"
	};
	var devDependencies = {
		"@rollup/plugin-commonjs": "^24.0.0",
		"@rollup/plugin-node-resolve": "^15.0.0",
		"@rollup/plugin-terser": "^0.4.0",
		"javascript-obfuscator": "^4.1.1",
		rollup: "^3.15.0",
		"rollup-plugin-css-only": "^4.3.0",
		"rollup-plugin-livereload": "^2.0.0",
		"rollup-plugin-obfuscator": "^1.1.0",
		"rollup-plugin-svelte": "^7.1.2",
		svelte: "^4.2.20"
	};
	var dependencies = {
		"@rollup/plugin-json": "^6.1.0",
		"crypto-js": "^4.2.0",
		"sirv-cli": "^2.0.0"
	};
	var pkg = {
		name: name,
		version: version,
		"private": true,
		type: type,
		scripts: scripts,
		devDependencies: devDependencies,
		dependencies: dependencies
	};

	/* src\App.svelte generated by Svelte v4.2.20 */

	const { console: console_1 } = globals;
	const file = "src\\App.svelte";

	function get_each_context(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[38] = list[i];
		return child_ctx;
	}

	function get_each_context_1(ctx, list, i) {
		const child_ctx = ctx.slice();
		child_ctx[41] = list[i];
		return child_ctx;
	}

	// (492:12) {:else}
	function create_else_block(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Upgrades");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_else_block.name,
			type: "else",
			source: "(492:12) {:else}",
			ctx
		});

		return block;
	}

	// (490:12) {#if isUpgradeOpen}
	function create_if_block_2(ctx) {
		let t;

		const block = {
			c: function create() {
				t = text("Close Upgrades");
			},
			m: function mount(target, anchor) {
				insert_dev(target, t, anchor);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(t);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_2.name,
			type: "if",
			source: "(490:12) {#if isUpgradeOpen}",
			ctx
		});

		return block;
	}

	// (516:8) {#each particles as p (p.id)}
	function create_each_block_1(key_1, ctx) {
		let span;
		let html_tag;
		let raw_value = /*p*/ ctx[41].char + "";
		let t;

		const block = {
			key: key_1,
			first: null,
			c: function create() {
				span = element("span");
				html_tag = new HtmlTag(false);
				t = space();
				html_tag.a = t;
				attr_dev(span, "class", "particle svelte-1pcwqjd");
				set_style(span, "left", /*p*/ ctx[41].x + "px");
				set_style(span, "top", /*p*/ ctx[41].y + "px");
				set_style(span, "transform", "rotate(" + /*p*/ ctx[41].rotation + "deg) scale(" + /*p*/ ctx[41].scale + ")");
				set_style(span, "opacity", /*p*/ ctx[41].opacity);
				add_location(span, file, 516, 12, 14745);
				this.first = span;
			},
			m: function mount(target, anchor) {
				insert_dev(target, span, anchor);
				html_tag.m(raw_value, span);
				append_dev(span, t);
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty[0] & /*particles*/ 2 && raw_value !== (raw_value = /*p*/ ctx[41].char + "")) html_tag.p(raw_value);

				if (dirty[0] & /*particles*/ 2) {
					set_style(span, "left", /*p*/ ctx[41].x + "px");
				}

				if (dirty[0] & /*particles*/ 2) {
					set_style(span, "top", /*p*/ ctx[41].y + "px");
				}

				if (dirty[0] & /*particles*/ 2) {
					set_style(span, "transform", "rotate(" + /*p*/ ctx[41].rotation + "deg) scale(" + /*p*/ ctx[41].scale + ")");
				}

				if (dirty[0] & /*particles*/ 2) {
					set_style(span, "opacity", /*p*/ ctx[41].opacity);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(span);
				}
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block_1.name,
			type: "each",
			source: "(516:8) {#each particles as p (p.id)}",
			ctx
		});

		return block;
	}

	// (532:4) {#if isUpgradeOpen}
	function create_if_block_1(ctx) {
		let aside;
		let div3;
		let div0;
		let h2;
		let t1;
		let button;
		let i;
		let t2;
		let p_1;
		let t4;
		let div1;
		let t5;
		let div2;
		let span0;
		let t6;
		let t7_value = formatNumber(/*bananasPerClick*/ ctx[8]) + "";
		let t7;
		let t8;
		let t9;
		let span1;
		let t10;
		let t11_value = formatNumber(/*bananas*/ ctx[7]) + "";
		let t11;
		let div3_transition;
		let current;
		let mounted;
		let dispose;
		let each_value = ensure_array_like_dev(/*mergedUpgrades*/ ctx[11]);
		let each_blocks = [];

		for (let i = 0; i < each_value.length; i += 1) {
			each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
		}

		const block = {
			c: function create() {
				aside = element("aside");
				div3 = element("div");
				div0 = element("div");
				h2 = element("h2");
				h2.textContent = "Upgrades";
				t1 = space();
				button = element("button");
				i = element("i");
				t2 = space();
				p_1 = element("p");
				p_1.textContent = "Click to buy, cost increases each purchase:";
				t4 = space();
				div1 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t5 = space();
				div2 = element("div");
				span0 = element("span");
				t6 = text("+");
				t7 = text(t7_value);
				t8 = text("/Click");
				t9 = space();
				span1 = element("span");
				t10 = text("Total bananas: ");
				t11 = text(t11_value);
				add_location(h2, file, 535, 20, 15242);
				attr_dev(i, "class", "fa fa-xmark");
				add_location(i, file, 541, 24, 15475);
				attr_dev(button, "class", "upgrade-close-btn svelte-1pcwqjd");
				attr_dev(button, "aria-label", "Close");
				add_location(button, file, 536, 20, 15280);
				attr_dev(div0, "class", "upgrade-header svelte-1pcwqjd");
				add_location(div0, file, 534, 16, 15193);
				add_location(p_1, file, 544, 16, 15572);
				attr_dev(div1, "class", "upgrades-container svelte-1pcwqjd");
				add_location(div1, file, 545, 16, 15639);
				attr_dev(span0, "class", "bperclick svelte-1pcwqjd");
				add_location(span0, file, 562, 20, 16448);
				add_location(span1, file, 565, 20, 16584);
				attr_dev(div2, "class", "upgrade-footer svelte-1pcwqjd");
				add_location(div2, file, 561, 16, 16399);
				attr_dev(div3, "class", "upgrade-wrapper svelte-1pcwqjd");
				add_location(div3, file, 533, 12, 15130);
				attr_dev(aside, "class", "upgrades svelte-1pcwqjd");
				add_location(aside, file, 532, 8, 15093);
			},
			m: function mount(target, anchor) {
				insert_dev(target, aside, anchor);
				append_dev(aside, div3);
				append_dev(div3, div0);
				append_dev(div0, h2);
				append_dev(div0, t1);
				append_dev(div0, button);
				append_dev(button, i);
				append_dev(div3, t2);
				append_dev(div3, p_1);
				append_dev(div3, t4);
				append_dev(div3, div1);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div1, null);
					}
				}

				append_dev(div3, t5);
				append_dev(div3, div2);
				append_dev(div2, span0);
				append_dev(span0, t6);
				append_dev(span0, t7);
				append_dev(span0, t8);
				append_dev(div2, t9);
				append_dev(div2, span1);
				append_dev(span1, t10);
				append_dev(span1, t11);
				current = true;

				if (!mounted) {
					dispose = listen_dev(button, "click", /*openUpgrades*/ ctx[17], false, false, false, false);
					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*bananas, mergedUpgrades, buyUpgrade*/ 18560) {
					each_value = ensure_array_like_dev(/*mergedUpgrades*/ ctx[11]);
					let i;

					for (i = 0; i < each_value.length; i += 1) {
						const child_ctx = get_each_context(ctx, each_value, i);

						if (each_blocks[i]) {
							each_blocks[i].p(child_ctx, dirty);
						} else {
							each_blocks[i] = create_each_block(child_ctx);
							each_blocks[i].c();
							each_blocks[i].m(div1, null);
						}
					}

					for (; i < each_blocks.length; i += 1) {
						each_blocks[i].d(1);
					}

					each_blocks.length = each_value.length;
				}

				if ((!current || dirty[0] & /*bananasPerClick*/ 256) && t7_value !== (t7_value = formatNumber(/*bananasPerClick*/ ctx[8]) + "")) set_data_dev(t7, t7_value);
				if ((!current || dirty[0] & /*bananas*/ 128) && t11_value !== (t11_value = formatNumber(/*bananas*/ ctx[7]) + "")) set_data_dev(t11, t11_value);
			},
			i: function intro(local) {
				if (current) return;

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, true);
						div3_transition.run(1);
					});
				}

				current = true;
			},
			o: function outro(local) {
				if (local) {
					if (!div3_transition) div3_transition = create_bidirectional_transition(div3, slide, {}, false);
					div3_transition.run(0);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(aside);
				}

				destroy_each(each_blocks, detaching);
				if (detaching && div3_transition) div3_transition.end();
				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block_1.name,
			type: "if",
			source: "(532:4) {#if isUpgradeOpen}",
			ctx
		});

		return block;
	}

	// (547:20) {#each mergedUpgrades as upgrade}
	function create_each_block(ctx) {
		let button;
		let t0_value = /*upgrade*/ ctx[38].name + "";
		let t0;
		let t1;
		let t2_value = formatNumber(/*upgrade*/ ctx[38].cost) + "";
		let t2;
		let t3;
		let img;
		let img_src_value;
		let t4;
		let button_disabled_value;
		let mounted;
		let dispose;

		function click_handler() {
			return /*click_handler*/ ctx[23](/*upgrade*/ ctx[38]);
		}

		const block = {
			c: function create() {
				button = element("button");
				t0 = text(t0_value);
				t1 = text(" (");
				t2 = text(t2_value);
				t3 = text(")\n                            ");
				img = element("img");
				t4 = space();
				if (!src_url_equal(img.src, img_src_value = "./banana.png")) attr_dev(img, "src", img_src_value);
				attr_dev(img, "alt", "🍌");
				attr_dev(img, "draggable", "false");
				set_style(img, "width", "15px");
				set_style(img, "height", "auto");
				set_style(img, "vertical-align", "middle");
				set_style(img, "margin-left", "5px");
				add_location(img, file, 552, 28, 16013);
				button.disabled = button_disabled_value = /*bananas*/ ctx[7] < /*upgrade*/ ctx[38].cost;
				attr_dev(button, "class", "svelte-1pcwqjd");
				add_location(button, file, 547, 24, 15750);
			},
			m: function mount(target, anchor) {
				insert_dev(target, button, anchor);
				append_dev(button, t0);
				append_dev(button, t1);
				append_dev(button, t2);
				append_dev(button, t3);
				append_dev(button, img);
				append_dev(button, t4);

				if (!mounted) {
					dispose = listen_dev(button, "click", click_handler, false, false, false, false);
					mounted = true;
				}
			},
			p: function update(new_ctx, dirty) {
				ctx = new_ctx;
				if (dirty[0] & /*mergedUpgrades*/ 2048 && t0_value !== (t0_value = /*upgrade*/ ctx[38].name + "")) set_data_dev(t0, t0_value);
				if (dirty[0] & /*mergedUpgrades*/ 2048 && t2_value !== (t2_value = formatNumber(/*upgrade*/ ctx[38].cost) + "")) set_data_dev(t2, t2_value);

				if (dirty[0] & /*bananas, mergedUpgrades*/ 2176 && button_disabled_value !== (button_disabled_value = /*bananas*/ ctx[7] < /*upgrade*/ ctx[38].cost)) {
					prop_dev(button, "disabled", button_disabled_value);
				}
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(button);
				}

				mounted = false;
				dispose();
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_each_block.name,
			type: "each",
			source: "(547:20) {#each mergedUpgrades as upgrade}",
			ctx
		});

		return block;
	}

	// (571:4) {#if isSettingsOpen}
	function create_if_block(ctx) {
		let aside;
		let div4;
		let div0;
		let h2;
		let t1;
		let button;
		let i;
		let t2;
		let div3;
		let div1;
		let span0;
		let t4;
		let label0;
		let input0;
		let t5;
		let span1;
		let t6;
		let div2;
		let span2;
		let t8;
		let label1;
		let input1;
		let t9;
		let span3;
		let div4_transition;
		let current;
		let mounted;
		let dispose;

		const block = {
			c: function create() {
				aside = element("aside");
				div4 = element("div");
				div0 = element("div");
				h2 = element("h2");
				h2.textContent = "Settings";
				t1 = space();
				button = element("button");
				i = element("i");
				t2 = space();
				div3 = element("div");
				div1 = element("div");
				span0 = element("span");
				span0.textContent = "Sound FX";
				t4 = space();
				label0 = element("label");
				input0 = element("input");
				t5 = space();
				span1 = element("span");
				t6 = space();
				div2 = element("div");
				span2 = element("span");
				span2.textContent = "Music";
				t8 = space();
				label1 = element("label");
				input1 = element("input");
				t9 = space();
				span3 = element("span");
				add_location(h2, file, 574, 20, 16889);
				attr_dev(i, "class", "fa fa-xmark");
				add_location(i, file, 580, 24, 17123);
				attr_dev(button, "class", "settings-close-btn svelte-1pcwqjd");
				attr_dev(button, "aria-label", "Close");
				add_location(button, file, 575, 20, 16927);
				attr_dev(div0, "class", "settings-header svelte-1pcwqjd");
				add_location(div0, file, 573, 16, 16839);
				add_location(span0, file, 586, 24, 17323);
				attr_dev(input0, "type", "checkbox");
				input0.checked = /*soundFX*/ ctx[10];
				attr_dev(input0, "class", "svelte-1pcwqjd");
				add_location(input0, file, 588, 28, 17420);
				attr_dev(span1, "class", "slider svelte-1pcwqjd");
				add_location(span1, file, 594, 28, 17703);
				attr_dev(label0, "class", "toggle svelte-1pcwqjd");
				add_location(label0, file, 587, 24, 17369);
				attr_dev(div1, "class", "setting-item svelte-1pcwqjd");
				add_location(div1, file, 585, 20, 17272);
				add_location(span2, file, 599, 24, 17864);
				attr_dev(input1, "type", "checkbox");
				input1.checked = /*music*/ ctx[0];
				attr_dev(input1, "class", "svelte-1pcwqjd");
				add_location(input1, file, 601, 28, 17958);
				attr_dev(span3, "class", "slider svelte-1pcwqjd");
				add_location(span3, file, 606, 28, 18201);
				attr_dev(label1, "class", "toggle svelte-1pcwqjd");
				add_location(label1, file, 600, 24, 17907);
				attr_dev(div2, "class", "setting-item svelte-1pcwqjd");
				add_location(div2, file, 598, 20, 17813);
				attr_dev(div3, "class", "settings-options svelte-1pcwqjd");
				add_location(div3, file, 584, 16, 17221);
				attr_dev(div4, "class", "settings-wrapper svelte-1pcwqjd");
				add_location(div4, file, 572, 12, 16775);
				attr_dev(aside, "class", "settings svelte-1pcwqjd");
				add_location(aside, file, 571, 8, 16738);
			},
			m: function mount(target, anchor) {
				insert_dev(target, aside, anchor);
				append_dev(aside, div4);
				append_dev(div4, div0);
				append_dev(div0, h2);
				append_dev(div0, t1);
				append_dev(div0, button);
				append_dev(button, i);
				append_dev(div4, t2);
				append_dev(div4, div3);
				append_dev(div3, div1);
				append_dev(div1, span0);
				append_dev(div1, t4);
				append_dev(div1, label0);
				append_dev(label0, input0);
				append_dev(label0, t5);
				append_dev(label0, span1);
				append_dev(div3, t6);
				append_dev(div3, div2);
				append_dev(div2, span2);
				append_dev(div2, t8);
				append_dev(div2, label1);
				append_dev(label1, input1);
				append_dev(label1, t9);
				append_dev(label1, span3);
				current = true;

				if (!mounted) {
					dispose = [
						listen_dev(button, "click", /*openSettings*/ ctx[18], false, false, false, false),
						listen_dev(input0, "change", /*change_handler*/ ctx[24], false, false, false, false),
						listen_dev(input1, "change", /*change_handler_1*/ ctx[25], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (!current || dirty[0] & /*soundFX*/ 1024) {
					prop_dev(input0, "checked", /*soundFX*/ ctx[10]);
				}

				if (!current || dirty[0] & /*music*/ 1) {
					prop_dev(input1, "checked", /*music*/ ctx[0]);
				}
			},
			i: function intro(local) {
				if (current) return;

				if (local) {
					add_render_callback(() => {
						if (!current) return;
						if (!div4_transition) div4_transition = create_bidirectional_transition(div4, slide, {}, true);
						div4_transition.run(1);
					});
				}

				current = true;
			},
			o: function outro(local) {
				if (local) {
					if (!div4_transition) div4_transition = create_bidirectional_transition(div4, slide, {}, false);
					div4_transition.run(0);
				}

				current = false;
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(aside);
				}

				if (detaching && div4_transition) div4_transition.end();
				mounted = false;
				run_all(dispose);
			}
		};

		dispatch_dev("SvelteRegisterBlock", {
			block,
			id: create_if_block.name,
			type: "if",
			source: "(571:4) {#if isSettingsOpen}",
			ctx
		});

		return block;
	}

	function create_fragment(ctx) {
		let main;
		let div0;
		let h1;
		let img0;
		let img0_src_value;
		let t0;
		let span0;
		let t3;
		let button0;
		let i0;
		let t4;
		let div3;
		let span1;
		let img1;
		let img1_src_value;
		let t5;
		let t6_value = formatNumber(/*bananas*/ ctx[7]) + "";
		let t6;
		let t7;
		let div1;
		let img2;
		let img2_src_value;
		let t8;
		let button1;
		let t9;
		let div2;
		let spna0;
		let t10;
		let t11_value = formatNumber(/*multiplier*/ ctx[6]) + "";
		let t11;
		let t12;
		let t13;
		let spna1;
		let t14;
		let t15_value = formatNumber(/*autoClickPower*/ ctx[9]) + "";
		let t15;
		let t16;
		let t17;
		let spna2;
		let t18;
		let t19_value = formatNumber(/*bananasPerClick*/ ctx[8]) + "";
		let t19;
		let t20;
		let t21;
		let a;
		let i1;
		let t22;
		let div4;
		let each_blocks = [];
		let each_1_lookup = new Map();
		let t23;
		let t24;
		let mounted;
		let dispose;

		function select_block_type(ctx, dirty) {
			if (/*isUpgradeOpen*/ ctx[3]) return create_if_block_2;
			return create_else_block;
		}

		let current_block_type = select_block_type(ctx);
		let if_block0 = current_block_type(ctx);
		let each_value_1 = ensure_array_like_dev(/*particles*/ ctx[1]);
		const get_key = ctx => /*p*/ ctx[41].id;
		validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

		for (let i = 0; i < each_value_1.length; i += 1) {
			let child_ctx = get_each_context_1(ctx, each_value_1, i);
			let key = get_key(child_ctx);
			each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
		}

		let if_block1 = /*isUpgradeOpen*/ ctx[3] && create_if_block_1(ctx);
		let if_block2 = /*isSettingsOpen*/ ctx[2] && create_if_block(ctx);

		const block = {
			c: function create() {
				main = element("main");
				div0 = element("div");
				h1 = element("h1");
				img0 = element("img");
				t0 = space();
				span0 = element("span");
				span0.textContent = `v${/*version*/ ctx[12]}`;
				t3 = space();
				button0 = element("button");
				i0 = element("i");
				t4 = space();
				div3 = element("div");
				span1 = element("span");
				img1 = element("img");
				t5 = space();
				t6 = text(t6_value);
				t7 = space();
				div1 = element("div");
				img2 = element("img");
				t8 = space();
				button1 = element("button");
				if_block0.c();
				t9 = space();
				div2 = element("div");
				spna0 = element("spna");
				t10 = text("x");
				t11 = text(t11_value);
				t12 = text(" Multiplier");
				t13 = space();
				spna1 = element("spna");
				t14 = text("+");
				t15 = text(t15_value);
				t16 = text("/s (Auto)");
				t17 = space();
				spna2 = element("spna");
				t18 = text("+");
				t19 = text(t19_value);
				t20 = text("/Click");
				t21 = space();
				a = element("a");
				i1 = element("i");
				t22 = space();
				div4 = element("div");

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].c();
				}

				t23 = space();
				if (if_block1) if_block1.c();
				t24 = space();
				if (if_block2) if_block2.c();
				if (!src_url_equal(img0.src, img0_src_value = "./logo.png")) attr_dev(img0, "src", img0_src_value);
				attr_dev(img0, "alt", "🍌");
				attr_dev(img0, "draggable", "false");
				set_style(img0, "width", "200px");
				set_style(img0, "height", "auto");
				set_style(img0, "vertical-align", "middle");
				set_style(img0, "margin-right", "5px");
				add_location(img0, file, 452, 12, 12532);
				attr_dev(span0, "class", "version svelte-1pcwqjd");
				add_location(span0, file, 458, 12, 12749);
				attr_dev(h1, "class", "title svelte-1pcwqjd");
				add_location(h1, file, 451, 8, 12501);
				attr_dev(i0, "class", "fa fa-gear");
				add_location(i0, file, 461, 12, 12891);
				attr_dev(button0, "class", "menu svelte-1pcwqjd");
				attr_dev(button0, "aria-label", "Settings");
				add_location(button0, file, 460, 8, 12811);
				attr_dev(div0, "class", "header svelte-1pcwqjd");
				add_location(div0, file, 450, 4, 12472);
				if (!src_url_equal(img1.src, img1_src_value = "./banana.png")) attr_dev(img1, "src", img1_src_value);
				attr_dev(img1, "alt", "🍌");
				attr_dev(img1, "draggable", "false");
				set_style(img1, "width", "30px");
				set_style(img1, "height", "auto");
				set_style(img1, "vertical-align", "middle");
				set_style(img1, "margin-right", "5px");
				add_location(img1, file, 468, 12, 13115);
				attr_dev(span1, "class", "score-count svelte-1pcwqjd");
				toggle_class(span1, "animate", /*animateLabel*/ ctx[5]);
				add_location(span1, file, 467, 8, 13047);
				if (!src_url_equal(img2.src, img2_src_value = "./bananaman.png")) attr_dev(img2, "src", img2_src_value);
				attr_dev(img2, "alt", "🍌");
				attr_dev(img2, "draggable", "false");
				attr_dev(img2, "class", "svelte-1pcwqjd");
				add_location(img2, file, 485, 12, 13744);
				attr_dev(div1, "class", "banana-center svelte-1pcwqjd");
				add_location(div1, file, 480, 8, 13610);
				attr_dev(button1, "class", "upgrade-button svelte-1pcwqjd");
				add_location(button1, file, 488, 8, 13825);
				attr_dev(spna0, "class", "multipliers");
				add_location(spna0, file, 496, 12, 14074);
				attr_dev(spna1, "class", "autoClickPower");
				add_location(spna1, file, 499, 12, 14188);
				attr_dev(spna2, "class", "clickBuff");
				add_location(spna2, file, 502, 12, 14307);
				attr_dev(div2, "class", "buff-container svelte-1pcwqjd");
				add_location(div2, file, 495, 8, 14033);
				attr_dev(i1, "class", "fa-brands fa-github");
				add_location(i1, file, 509, 32, 14569);
				attr_dev(a, "href", "https://github.com/cosmic-fi/BananaClicker");
				attr_dev(a, "class", "githublink svelte-1pcwqjd");
				attr_dev(a, "target", "_blank");
				attr_dev(a, "aria-label", "Github");
				add_location(a, file, 505, 8, 14413);
				attr_dev(div3, "class", "game-area svelte-1pcwqjd");
				add_location(div3, file, 466, 4, 13015);
				attr_dev(div4, "class", "particle-container svelte-1pcwqjd");
				add_location(div4, file, 514, 4, 14662);
				attr_dev(main, "class", "svelte-1pcwqjd");
				add_location(main, file, 449, 0, 12461);
			},
			l: function claim(nodes) {
				throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
			},
			m: function mount(target, anchor) {
				insert_dev(target, main, anchor);
				append_dev(main, div0);
				append_dev(div0, h1);
				append_dev(h1, img0);
				append_dev(h1, t0);
				append_dev(h1, span0);
				append_dev(div0, t3);
				append_dev(div0, button0);
				append_dev(button0, i0);
				append_dev(main, t4);
				append_dev(main, div3);
				append_dev(div3, span1);
				append_dev(span1, img1);
				append_dev(span1, t5);
				append_dev(span1, t6);
				append_dev(div3, t7);
				append_dev(div3, div1);
				append_dev(div1, img2);
				/*div1_binding*/ ctx[22](div1);
				append_dev(div3, t8);
				append_dev(div3, button1);
				if_block0.m(button1, null);
				append_dev(div3, t9);
				append_dev(div3, div2);
				append_dev(div2, spna0);
				append_dev(spna0, t10);
				append_dev(spna0, t11);
				append_dev(spna0, t12);
				append_dev(div2, t13);
				append_dev(div2, spna1);
				append_dev(spna1, t14);
				append_dev(spna1, t15);
				append_dev(spna1, t16);
				append_dev(div2, t17);
				append_dev(div2, spna2);
				append_dev(spna2, t18);
				append_dev(spna2, t19);
				append_dev(spna2, t20);
				append_dev(div3, t21);
				append_dev(div3, a);
				append_dev(a, i1);
				append_dev(main, t22);
				append_dev(main, div4);

				for (let i = 0; i < each_blocks.length; i += 1) {
					if (each_blocks[i]) {
						each_blocks[i].m(div4, null);
					}
				}

				append_dev(main, t23);
				if (if_block1) if_block1.m(main, null);
				append_dev(main, t24);
				if (if_block2) if_block2.m(main, null);

				if (!mounted) {
					dispose = [
						listen_dev(button0, "click", /*openSettings*/ ctx[18], false, false, false, false),
						listen_dev(div1, "click", /*clickBanana*/ ctx[13], false, false, false, false),
						listen_dev(button1, "click", /*openUpgrades*/ ctx[17], false, false, false, false)
					];

					mounted = true;
				}
			},
			p: function update(ctx, dirty) {
				if (dirty[0] & /*bananas*/ 128 && t6_value !== (t6_value = formatNumber(/*bananas*/ ctx[7]) + "")) set_data_dev(t6, t6_value);

				if (dirty[0] & /*animateLabel*/ 32) {
					toggle_class(span1, "animate", /*animateLabel*/ ctx[5]);
				}

				if (current_block_type !== (current_block_type = select_block_type(ctx))) {
					if_block0.d(1);
					if_block0 = current_block_type(ctx);

					if (if_block0) {
						if_block0.c();
						if_block0.m(button1, null);
					}
				}

				if (dirty[0] & /*multiplier*/ 64 && t11_value !== (t11_value = formatNumber(/*multiplier*/ ctx[6]) + "")) set_data_dev(t11, t11_value);
				if (dirty[0] & /*autoClickPower*/ 512 && t15_value !== (t15_value = formatNumber(/*autoClickPower*/ ctx[9]) + "")) set_data_dev(t15, t15_value);
				if (dirty[0] & /*bananasPerClick*/ 256 && t19_value !== (t19_value = formatNumber(/*bananasPerClick*/ ctx[8]) + "")) set_data_dev(t19, t19_value);

				if (dirty[0] & /*particles*/ 2) {
					each_value_1 = ensure_array_like_dev(/*particles*/ ctx[1]);
					validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
					each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div4, destroy_block, create_each_block_1, null, get_each_context_1);
				}

				if (/*isUpgradeOpen*/ ctx[3]) {
					if (if_block1) {
						if_block1.p(ctx, dirty);

						if (dirty[0] & /*isUpgradeOpen*/ 8) {
							transition_in(if_block1, 1);
						}
					} else {
						if_block1 = create_if_block_1(ctx);
						if_block1.c();
						transition_in(if_block1, 1);
						if_block1.m(main, t24);
					}
				} else if (if_block1) {
					group_outros();

					transition_out(if_block1, 1, 1, () => {
						if_block1 = null;
					});

					check_outros();
				}

				if (/*isSettingsOpen*/ ctx[2]) {
					if (if_block2) {
						if_block2.p(ctx, dirty);

						if (dirty[0] & /*isSettingsOpen*/ 4) {
							transition_in(if_block2, 1);
						}
					} else {
						if_block2 = create_if_block(ctx);
						if_block2.c();
						transition_in(if_block2, 1);
						if_block2.m(main, null);
					}
				} else if (if_block2) {
					group_outros();

					transition_out(if_block2, 1, 1, () => {
						if_block2 = null;
					});

					check_outros();
				}
			},
			i: function intro(local) {
				transition_in(if_block1);
				transition_in(if_block2);
			},
			o: function outro(local) {
				transition_out(if_block1);
				transition_out(if_block2);
			},
			d: function destroy(detaching) {
				if (detaching) {
					detach_dev(main);
				}

				/*div1_binding*/ ctx[22](null);
				if_block0.d();

				for (let i = 0; i < each_blocks.length; i += 1) {
					each_blocks[i].d();
				}

				if (if_block1) if_block1.d();
				if (if_block2) if_block2.d();
				mounted = false;
				run_all(dispose);
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

	const MAX_PARTICLES = 700;

	// --- Number Formatting ---
	function formatNumber(n) {
		if (n == null || Number.isNaN(n)) return "0"; // catch undefined / null

		const suffixes = [
			"",
			"K",
			"M",
			"B",
			"T",
			"Q",
			"Qi",
			"Sx",
			"Sp",
			"Oc",
			"No",
			"Dc",
			"Ud",
			"Dd",
			"Td",
			"QaQd",
			"SxQd",
			"SpQd",
			"OcqD",
			"NvD",
			"Ugn",
			"Tgn",
			"Qagn",
			"Sxgn",
			"Spgn",
			"Ocgn",
			"Nvgn",
			"Ce",
			"Uce",
			"Dce",
			"Tce",
			"Qace",
			"Sxce",
			"Spce",
			"Occe",
			"Nvce",
			"Ct",
			"Uct",
			"Dct",
			"Tct",
			"Qact",
			"Sxct",
			"Spct",
			"Occt",
			"Nvct",
			"Se",
			"Use",
			"Dse",
			"Tse",
			"Qase",
			"Sxse",
			"Spse",
			"Ocse",
			"Nvse",
			"Og",
			"Uog",
			"Dog",
			"Tog",
			"Qaog",
			"Sxog",
			"Spog",
			"Ocog",
			"Nvog",
			"Un",
			"Dun",
			"Tun",
			"Qaun",
			"Sxun",
			"Spun",
			"Ocun",
			"Nvn",
			"Tr",
			"Utr",
			"Dtr",
			"Ttr",
			"Qatr",
			"Sxtr",
			"Sptr",
			"Octr",
			"Nvtr",
			"Qd",
			"Uqd",
			"Dqd",
			"Tqd",
			"QaQd",
			"SxQd",
			"SpQd",
			"OcqD",
			"NvQd",
			"Qt",
			"Uqt",
			"Dqt",
			"Tqt",
			"Qaqt",
			"Sxqt",
			"Spqt",
			"Ocqt",
			"Nvqt",
			"Sxqt",
			"Spqt",
			"Ocqt",
			"Nvqt",
			"Qn",
			"Uqn",
			"Dqn",
			"Tqn",
			"Qaqn",
			"Sxn",
			"Spn",
			"Ocn",
			"Nvn",
			"Qag",
			"Uqag",
			"Dqag",
			"Tqag",
			"Qaqag",
			"Sxqag",
			"Spqag",
			"Ocqag",
			"Nvqag",
			"Mul",
			"Umu",
			"Dmu",
			"Tmu",
			"Qamu",
			"Sxmu",
			"Spmu",
			"Ocmu",
			"Nvmu"
		];

		let i = 0;

		while (n >= 1000 && i < suffixes.length - 1) {
			n /= 1000;
			i++;
		}

		return (n % 1 === 0 ? n : Number(n.toFixed(2))) + suffixes[i];
	}

	function instance($$self, $$props, $$invalidate) {
		let mergedUpgrades;
		let { $$slots: slots = {}, $$scope } = $$props;
		validate_slots('App', slots, []);
		const version = pkg.version;

		//*=======***=======
		startBananaGuard();

		console.log(`%c Running Banana Version: ${version}`, "color: yellow;font-size:13px", "(Latest Client)");

		//*=======***=======
		let particleId = 0;

		let particles = [];
		let isSettingsOpen = false;
		let isUpgradeOpen = false;
		let bananaElement;
		let animateLabel = false;
		let multiplier = 0;

		let bananaParticles = [
			"./bananaParticles/particle1.svg",
			"./bananaParticles/particle2.svg",
			"./bananaParticles/particle3.png"
		];

		// Audio
		let clickSound = new Audio("./sfx/pop-banana.ogg");

		let upgradeSound = new Audio("./sfx/banana-upgrade.ogg");
		clickSound.volume = 0;

		const musicPlaylist = [
			{ src: "./bgm/bgm-1.mp3", volume: 0.3 },
			{ src: "./bgm/bgm-0.ogg", volume: 0.3 },
			{ src: "./bgm/bgm-2.mp3", volume: 0.3 },
			{ src: "./bgm/bgm-3.mp3", volume: 0.3 }
		];

		let currentTrackIndex = 0;
		let bgMusic = new Audio(musicPlaylist[currentTrackIndex].src);
		bgMusic.volume = musicPlaylist[currentTrackIndex].volume;
		bgMusic.loop = false;

		bgMusic.addEventListener("ended", () => {
			$$invalidate(19, currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length);
			$$invalidate(20, bgMusic.src = musicPlaylist[currentTrackIndex].src, bgMusic);
			$$invalidate(20, bgMusic.volume = musicPlaylist[currentTrackIndex].volume, bgMusic);
			if (music) bgMusic.play();
		});

		let bananas, bananasPerClick, autoClickPower, soundFX, music, upgrades;

		playerData.subscribe(data => {
			$$invalidate(7, bananas = data.bananas);
			$$invalidate(8, bananasPerClick = data.bananasPerClick);
			$$invalidate(9, autoClickPower = data.autoClickPower);
			$$invalidate(10, soundFX = data.soundFX);
			$$invalidate(0, music = data.music);
			$$invalidate(5, animateLabel = true);
			$$invalidate(6, multiplier = data.multiplier ?? 1);

			// Avoid updating the store here
			$$invalidate(21, upgrades = data.upgrades);

			setTimeout(
				() => {
					$$invalidate(5, animateLabel = false);
				},
				500
			);
		});

		// --- Click Banana ---
		function clickBanana(event) {
			playerData.update(data => {
				const amountGained = data.bananasPerClick * (data.multiplier || 1);
				const newBananas = data.bananas + amountGained;
				spawnParticles(event, 5, data.bananasPerClick);
				animateClick();

				if (data.soundFX) {
					const clickSoundClone = clickSound.cloneNode();
					clickSoundClone.volume = 0.1;
					clickSoundClone.play();
				}

				return { ...data, bananas: newBananas };
			});
		}

		// --- Buy Upgrade ---
		function buyUpgrade(upgrade) {
			playerData.update(data => {
				// Not enough bananas → ignore
				if (data.bananas < upgrade.cost) return data;

				let newData = { ...data };

				// Deduct cost
				newData.bananas -= upgrade.cost;

				// Increase cost by 25% after purchase
				const newCost = Math.ceil(upgrade.cost * 1.25);

				// Update upgrade in data.upgrades array
				const upIndex = newData.upgrades.findIndex(u => u.label === upgrade.label);

				if (upIndex === -1) {
					newData.upgrades.push({ label: upgrade.label, cost: newCost });
				} else {
					newData.upgrades[upIndex].cost = newCost;
				}

				// Apply upgrade effect
				switch (upgrade.type) {
					case "click":
						newData.bananasPerClick = (newData.bananasPerClick || 0) + upgrade.value;
						break;
					case "auto":
						newData.autoClickPower = (newData.autoClickPower || 0) + upgrade.value;
						break;
					case "multiplier":
						newData.multiplier = (newData.multiplier || 0) + upgrade.value;
						break;
					case "special":
						triggerSpecialEffect(upgrade.label);
						break;
				}

				// Play upgrade sound
				if (data.soundFX) upgradeSound.cloneNode().play();

				return newData;
			});
		}

		// --- Toggle Sound / Music ---
		function toggleSoundFX(value) {
			playerData.update(data => ({ ...data, soundFX: value }));
		}

		function toggleMusic(value) {
			playerData.update(data => ({ ...data, music: value }));
		}

		// --- Auto-clicker ---
		setInterval(
			() => {
				playerData.update(data => {
					if (data.autoClickPower <= 0) return data;
					const newBananas = data.bananas + data.autoClickPower;

					spawnParticles(
						{
							clientX: window.innerWidth / 2,
							clientY: window.innerHeight / 2
						},
						5,
						data.autoClickPower
					);

					animateClick();

					if (data.soundFX) {
						const clickSoundClone = clickSound.cloneNode();
						clickSoundClone.volume = 0.2;
						clickSoundClone.play();
					}

					return { ...data, bananas: newBananas };
				});
			},
			1000
		);

		// --- Visibility Change Handling ---
		let animationFrameId = null;

		function handleVisibilityChange() {
			if (document.visibilityState === "hidden") {
				// Pause particle updates
				if (animationFrameId) {
					cancelAnimationFrame(animationFrameId);
					animationFrameId = null;
				}
			} else {
				// Resume particle updates
				if (!animationFrameId) {
					animationFrameId = requestAnimationFrame(animate);
				}
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		// --- Particle System ---
		function spawnParticles(event, count = 5, value = 1) {
			if (particles.length >= MAX_PARTICLES) return;
			const newParticles = [];

			for (let i = 0; i < count; i++) {
				const randomImg = bananaParticles[Math.floor(Math.random() * bananaParticles.length)];

				newParticles.push({
					id: particleId++,
					x: event.clientX + (Math.random() * 30 - 15),
					y: event.clientY + (Math.random() * 30 - 15),
					vx: (Math.random() - 0.5) * 6,
					vy: Math.random() * -6 - 2,
					scale: 4 + Math.random() * 0.5,
					scaleSpeed: 0.95 + Math.random() * 0.05,
					opacity: 1,
					opacitySpeed: 0.03 + Math.random() * 0.02,
					rotation: Math.random() * 360,
					rotationSpeed: (Math.random() - 0.5) * 10,
					char: `<img src="${randomImg}" alt="🍌" draggable="false" style="width:20px; height:auto;" />`
				});
			}

			$$invalidate(1, particles = [...particles, ...newParticles].slice(0, MAX_PARTICLES));
		}

		function updateParticles() {
			$$invalidate(1, particles = particles.map(p => {
				p.x += p.vx;
				p.y += p.vy;
				p.vy += 0.2;
				p.scale *= p.scaleSpeed;
				p.opacity -= p.opacitySpeed;
				p.rotation += p.rotationSpeed;
				return p;
			}).filter(p => p.opacity > 0 && p.scale >= 0.1));
		}

		function animate() {
			updateParticles();
			animationFrameId = requestAnimationFrame(animate);
		}

		// Start the animation loop initially
		animationFrameId = requestAnimationFrame(animate);

		// --- UI ---
		function openUpgrades() {
			$$invalidate(3, isUpgradeOpen = !isUpgradeOpen);
		}

		function openSettings() {
			$$invalidate(2, isSettingsOpen = !isSettingsOpen);
		}

		function animateClick() {
			$$invalidate(4, bananaElement.style.transform = "scale(0.9)", bananaElement);

			setTimeout(
				() => {
					$$invalidate(4, bananaElement.style.transform = "scale(1)", bananaElement);
				},
				100
			);
		}

		function triggerSpecialEffect(label) {
			if (label === "Banana Rain") {
				for (let i = 0; i < 100; i++) {
					spawnParticles(
						{
							clientX: Math.random() * window.innerWidth,
							clientY: Math.random() * window.innerHeight
						},
						1,
						1000
					);
				}
			} else if (label === "Banana Universe") {
				document.body.style.transition = "background 1s ease";
				document.body.style.background = "linear-gradient(135deg, gold, orange, yellow)";
				setTimeout(() => document.body.style.background = "", 10000);
			}
		}

		const writable_props = [];

		Object.keys($$props).forEach(key => {
			if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
		});

		function div1_binding($$value) {
			binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				bananaElement = $$value;
				$$invalidate(4, bananaElement);
			});
		}

		const click_handler = upgrade => buyUpgrade(upgrade);
		const change_handler = e => toggleSoundFX(e.target.checked);
		const change_handler_1 = e => toggleMusic(e.target.checked);

		$$self.$capture_state = () => ({
			slide,
			playerData,
			upgradesList,
			startBananaGuard,
			pkg,
			version,
			particleId,
			particles,
			MAX_PARTICLES,
			isSettingsOpen,
			isUpgradeOpen,
			bananaElement,
			animateLabel,
			multiplier,
			bananaParticles,
			clickSound,
			upgradeSound,
			musicPlaylist,
			currentTrackIndex,
			bgMusic,
			bananas,
			bananasPerClick,
			autoClickPower,
			soundFX,
			music,
			upgrades,
			clickBanana,
			buyUpgrade,
			toggleSoundFX,
			toggleMusic,
			animationFrameId,
			handleVisibilityChange,
			spawnParticles,
			updateParticles,
			animate,
			openUpgrades,
			openSettings,
			animateClick,
			triggerSpecialEffect,
			formatNumber,
			mergedUpgrades
		});

		$$self.$inject_state = $$props => {
			if ('particleId' in $$props) particleId = $$props.particleId;
			if ('particles' in $$props) $$invalidate(1, particles = $$props.particles);
			if ('isSettingsOpen' in $$props) $$invalidate(2, isSettingsOpen = $$props.isSettingsOpen);
			if ('isUpgradeOpen' in $$props) $$invalidate(3, isUpgradeOpen = $$props.isUpgradeOpen);
			if ('bananaElement' in $$props) $$invalidate(4, bananaElement = $$props.bananaElement);
			if ('animateLabel' in $$props) $$invalidate(5, animateLabel = $$props.animateLabel);
			if ('multiplier' in $$props) $$invalidate(6, multiplier = $$props.multiplier);
			if ('bananaParticles' in $$props) bananaParticles = $$props.bananaParticles;
			if ('clickSound' in $$props) clickSound = $$props.clickSound;
			if ('upgradeSound' in $$props) upgradeSound = $$props.upgradeSound;
			if ('currentTrackIndex' in $$props) $$invalidate(19, currentTrackIndex = $$props.currentTrackIndex);
			if ('bgMusic' in $$props) $$invalidate(20, bgMusic = $$props.bgMusic);
			if ('bananas' in $$props) $$invalidate(7, bananas = $$props.bananas);
			if ('bananasPerClick' in $$props) $$invalidate(8, bananasPerClick = $$props.bananasPerClick);
			if ('autoClickPower' in $$props) $$invalidate(9, autoClickPower = $$props.autoClickPower);
			if ('soundFX' in $$props) $$invalidate(10, soundFX = $$props.soundFX);
			if ('music' in $$props) $$invalidate(0, music = $$props.music);
			if ('upgrades' in $$props) $$invalidate(21, upgrades = $$props.upgrades);
			if ('animationFrameId' in $$props) animationFrameId = $$props.animationFrameId;
			if ('mergedUpgrades' in $$props) $$invalidate(11, mergedUpgrades = $$props.mergedUpgrades);
		};

		if ($$props && "$$inject" in $$props) {
			$$self.$inject_state($$props.$$inject);
		}

		$$self.$$.update = () => {
			if ($$self.$$.dirty[0] & /*music, bgMusic, currentTrackIndex*/ 1572865) {
				{
					if (music) {
						if (!bgMusic.src) {
							$$invalidate(20, bgMusic.src = musicPlaylist[currentTrackIndex].src, bgMusic);
							$$invalidate(20, bgMusic.volume = musicPlaylist[currentTrackIndex].volume, bgMusic);
						}

						bgMusic.play();
					} else {
						bgMusic.pause();
					}
				}
			}

			if ($$self.$$.dirty[0] & /*upgrades*/ 2097152) {
				$$invalidate(11, mergedUpgrades = upgradesList.map(u => {
					const owned = upgrades?.find(o => o.label === u.label);
					return owned ? { ...u, cost: owned.cost } : u;
				}));
			}
		};

		return [
			music,
			particles,
			isSettingsOpen,
			isUpgradeOpen,
			bananaElement,
			animateLabel,
			multiplier,
			bananas,
			bananasPerClick,
			autoClickPower,
			soundFX,
			mergedUpgrades,
			version,
			clickBanana,
			buyUpgrade,
			toggleSoundFX,
			toggleMusic,
			openUpgrades,
			openSettings,
			currentTrackIndex,
			bgMusic,
			upgrades,
			div1_binding,
			click_handler,
			change_handler,
			change_handler_1
		];
	}

	class App extends SvelteComponentDev {
		constructor(options) {
			super(options);
			init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

			dispatch_dev("SvelteRegisterComponent", {
				component: this,
				tagName: "App",
				options,
				id: create_fragment.name
			});
		}
	}

	const app = new App({
		target: document.body
	});

	return app;

})();
//# sourceMappingURL=banana_bundle.js.map
