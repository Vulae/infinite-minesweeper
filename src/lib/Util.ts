


// https://stackoverflow.com/questions/41253310#answer-51399781
export type ArrayElement<ArrayType extends readonly unknown[]> = 
    ArrayType extends readonly (infer ElementType)[] ? ElementType : never;



export function clampNormal(x: number): number {
    return (x < 0) ? 0 : ((x > 1) ? 1 : x);
}


