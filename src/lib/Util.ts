


// https://stackoverflow.com/questions/41253310#answer-51399781
export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;



export function clampNormal(x: number): number {
    return (x < 0) ? 0 : ((x > 1) ? 1 : x);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}



export function createCanvasCtx(width: number, height: number): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvasCtx(img: HTMLImageElement): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvasCtx(canvas: HTMLCanvasElement): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvasCtx(canvasOrImg: HTMLImageElement | HTMLCanvasElement): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvasCtx(): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvasCtx(a?: number | HTMLCanvasElement | HTMLImageElement, b?: number): [ HTMLCanvasElement, CanvasRenderingContext2D ] {
    if(a instanceof HTMLCanvasElement) {
        const ctx = a.getContext('2d');
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ a, ctx ];
    } else if(a instanceof HTMLImageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = a.width;
        canvas.height = a.height;
        const ctx = canvas.getContext('2d');
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ canvas, ctx ];
    } else if(typeof a == 'number') {
        const canvas = document.createElement('canvas');
        canvas.width = a;
        canvas.height = b!;
        const ctx = canvas.getContext('2d');
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ canvas, ctx ];
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ canvas, ctx ];
    }
    throw new Error('createCanvasCTX: Invalid arguments.');
}


