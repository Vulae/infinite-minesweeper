export function* spiralIter(offsetX: number, offsetY: number): Generator<{ x: number; y: number }> {
    let x = offsetX;
    let y = offsetY;
    let d = 1;
    let m = 1;
    while (true) {
        while (2 * x * d < m) {
            yield { x, y };
            x += d;
        }
        while (2 * y * d < m) {
            yield { x, y };
            y += d;
        }
        d = -1 * d;
        m += 1;
    }
}

export function mapRange(
    value: number,
    valueMin: number,
    valueMax: number,
    outMin: number,
    outMax: number
): number {
    if (value < valueMin || value > valueMax) {
        console.warn(
            `Mapped value outside of mapping range. mapRange(${value}, ${valueMin}, ${valueMax}, ${outMin}, ${outMax})`
        );
    }
    return outMin + ((value - valueMin) / (valueMax - valueMin)) * (outMax - outMin);
}

export function mapRangeInt(
    value: number,
    valueMin: number,
    valueMax: number,
    outMin: number,
    outMax: number
): number {
    return Math.floor(mapRange(value, valueMin, valueMax, outMin, outMax + 1));
}

export function clamp(x: number, min: number, max: number): number {
    return x < min ? min : x > max ? max : x;
}

export function clampNormal(x: number): number {
    return x < 0 ? 0 : x > 1 ? 1 : x;
}
