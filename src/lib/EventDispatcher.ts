


let ID_NUM = 0;
function getId(): number {
    return ID_NUM++;
}





type EventMap = {[key: string]: any};

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

export type EventListener<M extends EventMap = any, K extends keyof M = any> = {
    readonly key: K;
    readonly callbackfn: (event: Event<M, K>) => any;
    readonly priority: number;
    readonly id: number;
    readonly once: boolean;
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
    public get dispatcherDestroyed(): boolean { return this._dispatcherDestroyed; }
    private dispatcherCheckDestroyed(): void {
        if(this.dispatcherDestroyed) {
            throw new Error('EventDispatcher used after destroyed.');
        }
    }

    private listeners: {[K in keyof M]?: EventListener<M, K>[]} = {};
    private getListenersArr<K extends keyof M>(key: K): EventListener<M, K>[] {
        if(!this.listeners[key]) {
            this.listeners[key] = [];
        }
        return this.listeners[key]!;
    }
    private *listenersIter(): Iterable<EventListener<M, keyof M>> {
        for(const key in this.listeners) {
            const listeners = this.listeners[key as keyof M]!;
            for(const listener of listeners) {
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
    public addEventListener<K extends keyof M>(key: K, callbackfn: (event: Event<M, K>) => any, once: boolean = false, priority: number = 0): EventListener<M, K> {
        this.dispatcherCheckDestroyed();
        
        let listeners = this.getListenersArr(key);

        const listener: EventListener<M, K> = {
            key: key,
            callbackfn,
            priority,
            id: getId(),
            once
        };

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

        for(const listener of listeners) {
            let stop = false;
            listener.callbackfn({
                data,
                dispatcher: this,
                listener,
                stopPropagation: () => stop = true
            });

            if(listener.once) {
                this.removeEventListener(listener);
            }

            if(stop) break;
        }
    }

    /**
     * @param remove - Listener or listener UUID.
     * @returns - If successfully removed.
     */
    public removeEventListener<K extends keyof M>(remove: EventListener<M, K> | number): boolean {
        this.dispatcherCheckDestroyed();
        
        let removed = false;

        if(typeof remove != 'number') {
            const listeners = this.getListenersArr(remove.key);

            for(const listener of listeners) {
                if(listener.id == remove.id) {
                    listeners.splice(listeners.indexOf(listener), 1);
                    removed = true;
                }
            }
        } else {
            for(const listener of this.listenersIter()) {
                if(listener.id == remove) {
                    if(this.removeEventListener(listener)) {
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

        for(const key in this.listeners) {
            delete this.listeners[key];
        }
    }

}

