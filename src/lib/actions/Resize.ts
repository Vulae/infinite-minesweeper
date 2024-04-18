
import type { Action } from "svelte/action";



export const resize: Action<HTMLElement, (width: number, height: number) => any> = (node, callbackfn) => {
    const observer = new ResizeObserver(() => {
        callbackfn(node.clientWidth, node.clientHeight);
    });

    observer.observe(node);

    return {
        destroy() {
            observer.unobserve(node);
            observer.disconnect();
        }
    }
}


