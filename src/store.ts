
import type { InputMethod } from "$components/controller/Controller.svelte";
import type { Invalidator, Subscriber, Unsubscriber, Updater, Writable } from "svelte/store";



// Taken from svelte internal utils.
function save_not_equal(a: any, b: any): boolean {
    return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}



class LocalStorageWritable<T> implements Writable<T> {
    private readonly slot: string;
    private readonly key: string;
    private value?: T;

    public constructor(slot: string, key: string, _default: T) {
        this.slot = slot;
        this.key = key;

        this.load();
        if(this.value === undefined) {
            this.value = _default;
            this.save();
        }
    }

    private getObj(): {[key: string]: any} {
        let item = localStorage.getItem(this.slot);
        if(item === null) {
            localStorage.setItem(this.slot, '{}');
            item = localStorage.getItem(this.slot)!;
        }
        return JSON.parse(item);
    }

    private save(): void {
        const obj = this.getObj();
        obj[this.key] = this.value;
        localStorage.setItem(this.slot, JSON.stringify(obj));
        console.debug(`LocalStorageWritable: Saved to ${this.slot}['${this.key}'] = ${this.value}`);
    }

    private load(): void {
        const obj = this.getObj();
        this.value = (this.key in obj) ? obj[this.key] : undefined;
        console.debug(`LocalStorageWritable: Loaded from ${this.slot}['${this.key}'] = ${this.value}`);
    }



    private subscriptions: Set<[ Subscriber<T>, Invalidator<T> ]> = new Set();

    public set(value: T): void {
        if(save_not_equal(this.value, value)) {
            this.value = value;
            this.save();
            this.subscriptions.forEach(subscription => subscription[0](this.value!));
        }
    }

    public update(updater: Updater<T>): void {
        if(this.value) {
            this.set(updater(this.value));
        }
    }

    // TODO: Is there anything required to do with the Invalidator?
    public subscribe(run: Subscriber<T>, invalidate: Invalidator<T> = () => {}): Unsubscriber {
        const subscriber: [ Subscriber<T>, Invalidator<T> ] = [ run, invalidate ];
        this.subscriptions.add(subscriber);

        if(this.value !== undefined) {
            run(this.value);
        }

        return () => {
            this.subscriptions.delete(subscriber);
        }
    }
}



export const autoDisplayInfo = new LocalStorageWritable('settings', 'autoDisplayInfo', true);
export const volume = new LocalStorageWritable('settings', 'volume', 0.25);
export const inputMethod = new LocalStorageWritable<InputMethod>('settings', 'inputMethod', 'mouse');


