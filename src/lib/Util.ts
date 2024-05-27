


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





export function createCanvas2dContext(canvas: HTMLCanvasElement, asRef?: boolean, options?: CanvasRenderingContext2DSettings): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvas2dContext(img: HTMLImageElement, options?: CanvasRenderingContext2DSettings): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvas2dContext(width: number, height: number, options?: CanvasRenderingContext2DSettings): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvas2dContext(options?: CanvasRenderingContext2DSettings): [ HTMLCanvasElement, CanvasRenderingContext2D ];
export function createCanvas2dContext(a?: any, b?: any, c?: any): [ HTMLCanvasElement, CanvasRenderingContext2D ] {
    if(a instanceof HTMLCanvasElement) {
        let canvas: HTMLCanvasElement;
        if(b ?? true) {
            canvas = a;
        } else {
            canvas = document.createElement('canvas');
            canvas.width = a.width;
            canvas.height = a.height;
        }
        const ctx = canvas.getContext('2d', c as CanvasRenderingContext2DSettings);
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        if(!(b ?? true)) {
            ctx.drawImage(a, 0, 0);
        }
        return [ a, ctx ];
    } else if(a instanceof HTMLImageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = a.width;
        canvas.height = a.height;
        const ctx = canvas.getContext('2d', b as CanvasRenderingContext2DSettings);
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        ctx.drawImage(a, 0, 0);
        return [ canvas, ctx ];
    } else if(typeof a == 'number') {
        const canvas = document.createElement('canvas');
        canvas.width = a;
        canvas.height = b;
        const ctx = canvas.getContext('2d', c as CanvasRenderingContext2DSettings);
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ canvas, ctx ];
    } else {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', a as CanvasRenderingContext2DSettings);
        if(!ctx) {
            throw new Error('2d canvas context is not supported on this machine or browser.');
        }
        return [ canvas, ctx ];
    }
    throw new Error('createCanvasCTX: Invalid arguments.');
}





export function awaitImageLoad(img: HTMLImageElement | string): Promise<HTMLImageElement> {
    if(typeof img == 'string') {
        const src = img;
        img = document.createElement('img');
        img.src = src;
    }

    img.loading = 'eager';

    return new Promise((resolve, reject) => {
        if(img.complete && img.naturalWidth !== 0) {
            return resolve(img);
        }

        const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve(img);
        }
        const onError = (ev: ErrorEvent) => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            reject('Failed to load image.');
        }

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
    });
}

export async function getImageData(img: HTMLImageElement | string): Promise<ImageData> {
    img = await awaitImageLoad(img);
    const [ canvas, ctx ] = createCanvas2dContext(img);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
}


