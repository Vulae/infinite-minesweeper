


// https://stackoverflow.com/questions/41253310#answer-51399781
export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;



export function clampNormal(x: number): number {
    return (x < 0) ? 0 : ((x > 1) ? 1 : x);
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function mapRange(value: number, valueMin: number, valueMax: number, outMin: number, outMax: number): number {
    if(value < valueMin || value > valueMax) {
        console.warn(`Mapped value outside of mapping range. mapRange(${value}, ${valueMin}, ${valueMax}, ${outMin}, ${outMax})`);
    }
    return outMin + ((value - valueMin) / (valueMax - valueMin)) * (outMax - outMin);
}
export function mapRangeInt(value: number, valueMin: number, valueMax: number, outMin: number, outMax: number): number {
    return Math.floor(mapRange(value, valueMin, valueMax, outMin, outMax + 1));
}



/**
 * @param value UNSIGNED VALUE
 */
export function bitsToRepresentValue(value: number): number {
    let count = 0;
    while(value) {
        value &= value - 1;
        count++;
    }
    return count;
}



/**
 * Iterate over a spiral pattern.
 * https://stackoverflow.com/questions/398299#answer-33639875
 * @param offsetX Center X of spiral
 * @param offsetY Center Y of spiral
 */
export function* spiralIter(offsetX: number, offsetY: number): Generator<{ x: number, y: number }> {
    let x = offsetX;
    let y = offsetY;
    let d = 1;
    let m = 1;
    while(true) {
        while(2 * x * d < m) {
            yield { x, y };
            x += d;
        }
        while(2 * y * d < m) {
            yield { x, y };
            y += d;
        }
        d = -1 * d;
        m += 1;
    }
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


