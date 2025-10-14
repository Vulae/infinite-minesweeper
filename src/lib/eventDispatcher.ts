let ID_NUM = 0;
function getId(): number {
    return ID_NUM++;
}

type EventMap = { [key: string]: unknown };

type Event<M extends EventMap, K extends keyof M> = {
    readonly data: M[K];
    readonly dispatcher: EventDispatcher<M>;
    readonly listener: EventListener<M, K>;
    /**
     * Does not work asynchronously.
     */
    // TODO: Probably a different name for this.
    readonly stopPropagation: () => void;
};

class EventListenerInner<M extends EventMap, K extends keyof M> {
    readonly dispatcher: EventDispatcher<M>;
    readonly key: K;
    readonly callbackfn: (event: Event<M, K>) => unknown;
    readonly priority: number;
    readonly id: number;
    readonly once: boolean;
    public constructor(
        dispatcher: EventDispatcher<M>,
        key: K,
        callbackfn: (event: Event<M, K>) => unknown,
        priority: number,
        id: number,
        once: boolean
    ) {
        this.dispatcher = dispatcher;
        this.key = key;
        this.callbackfn = callbackfn;
        this.priority = priority;
        this.id = id;
        this.once = once;
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class EventListener<M extends EventMap = any, K extends keyof M = any> {
    private readonly inner: EventListenerInner<M, K>;
    public constructor(inner: EventListenerInner<M, K>) {
        this.inner = inner;
    }

    public get dispatcher(): EventDispatcher<M> {
        return this.inner.dispatcher;
    }
    public get key(): K {
        return this.inner.key;
    }
    public get callbackfn(): (event: Event<M, K>) => unknown {
        return this.inner.callbackfn;
    }
    public get priority(): number {
        return this.inner.priority;
    }
    public get id(): number {
        return this.inner.id;
    }
    public get once(): boolean {
        return this.inner.once;
    }

    public destroy(): boolean {
        return this.inner.dispatcher.removeEventListener(this);
    }
}

/**
 * ```TypeScript
 * class Thingy extends EventDispatcher<{
 *     'message': string;
 *     'warn': { level: number, message: string };
 * }> { }
 *
 * const thing = new Thingy();
 *
 *
 * thing.addEventListener('message', ({ data }) => console.log(data));
 * thing.dispatchEvent('message', "Hello, World!"); // Uses 'message' dispatcher that prints "Hello, World!".
 *
 *
 * thing.addEventListener('warn', ({ data: { level, message }, stopPropagation }) => {
 *     if(level < 10) return;
 *     stopPropagation();
 *     console.error("BIG ERROR", message);
 * }, false, 100);
 * thing.addEventListener('warn', ({ data: { level, message }}) => {
 *     console.warn("SMALL ERROR", message);
 * }, false, 0);
 *
 * thing.dispatchEvent('warn', { level: 0, message: "Error 1" }); // Uses only second 'warn' dispatcher.
 * thing.dispatchEvent('warn', { level: 10, message: "Error 2" }); // Uses only first 'warn' dispatcher.
 * thing.dispatchEvent('warn', { level: 0, message: "Error 1" }); // Uses only second 'warn' dispatcher.
 * ```
 */
export abstract class EventDispatcher<M extends EventMap> {
    private _dispatcherDestroyed: boolean = false;
    public get dispatcherDestroyed(): boolean {
        return this._dispatcherDestroyed;
    }
    private dispatcherCheckDestroyed(): void {
        if (this.dispatcherDestroyed) {
            throw new Error('EventDispatcher used after destroyed.');
        }
    }

    private listeners: { [K in keyof M]?: EventListener<M, K>[] } = {};
    private getListenersArr<K extends keyof M>(key: K): EventListener<M, K>[] {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        return this.listeners[key]!;
    }
    private *listenersIter(): Iterable<EventListener<M, keyof M>> {
        for (const key in this.listeners) {
            const listeners = this.listeners[key as keyof M]!;
            for (const listener of listeners) {
                yield listener;
            }
        }
    }

    /**
     * @param key - The key in the listener map to use.
     * @param callbackfn - The function to call when event is dispatched for this key.
     * @param once - If to destroy listener after called.
     * @param priority - Priority to sort listener to.
     * @returns - Event listener that was added.
     */
    public addEventListener<K extends keyof M>(
        key: K,
        callbackfn: (event: Event<M, K>) => unknown,
        once: boolean = false,
        priority: number = 0
    ): EventListener<M, K> {
        this.dispatcherCheckDestroyed();

        const listeners = this.getListenersArr(key);

        const listener: EventListener<M, K> = new EventListener(
            new EventListenerInner(this, key, callbackfn, priority, getId(), once)
        );

        listeners.push(listener);
        listeners.sort((a, b) => a.priority - b.priority);

        return listener;
    }

    /**
     * @param key - The key to choose what listeners to dispatch event to.
     * @param data - The data to dispatch to listeners.
     */
    public dispatchEvent<K extends keyof M>(key: K, data: M[K]): void {
        this.dispatcherCheckDestroyed();

        const listeners = this.getListenersArr(key);

        for (const listener of listeners) {
            let stop = false;
            listener.callbackfn({
                data,
                dispatcher: this,
                listener,
                stopPropagation: () => (stop = true)
            });

            if (listener.once) {
                this.removeEventListener(listener);
            }

            if (stop) break;
        }
    }

    /**
     * @param remove - Listener or listener UUID.
     * @returns - If successfully removed.
     */
    public removeEventListener<K extends keyof M>(remove: EventListener<M, K> | number): boolean {
        this.dispatcherCheckDestroyed();

        let removed = false;

        if (typeof remove != 'number') {
            const listeners = this.getListenersArr(remove.key);

            for (const listener of listeners) {
                if (listener.id == remove.id) {
                    listeners.splice(listeners.indexOf(listener), 1);
                    removed = true;
                }
            }
        } else {
            for (const listener of this.listenersIter()) {
                if (listener.id == remove) {
                    if (this.removeEventListener(listener)) {
                        removed = true;
                    }
                }
            }
        }

        return removed;
    }

    /**
     * Destroys the dispatcher cleaning up all listeners.
     * Dispatcher cannot be used after destroyed.
     */
    public destroyDispatcher(): void {
        this.dispatcherCheckDestroyed();

        this._dispatcherDestroyed = true;

        for (const key in this.listeners) {
            delete this.listeners[key];
        }
    }
}
