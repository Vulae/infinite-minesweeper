
import Pako from "pako";
import { Base64 } from "js-base64";



function hashStr(str: string): number {
    let hash: number = 0;
    if(str.length == 0) return hash;
    for(let i = 0; i < str.length; i++) {
        const chr: number = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return hash >>> 0;
}



// TODO: Clean up the resizing of buffer.
class EncodeCtx {
    public buffer: ArrayBuffer;
    public pointer: number = 0;

    public constructor(size: number = 4096) {
        this.buffer = new ArrayBuffer(size);
    }

    public update(requiredExtraSize: number = 512): void {
        if(this.buffer.byteLength < (this.pointer + requiredExtraSize)) {
            const newBuf = new Uint8Array(this.buffer.byteLength + requiredExtraSize + 1024);
            newBuf.set(new Uint8Array(this.buffer), 0);
            this.buffer = newBuf.buffer;
        }
    }

    public final(): ArrayBuffer {
        return this.buffer.slice(0, this.pointer);
    }



    public putByte(byte: number): void {
        this.update(1);
        const view = new DataView(this.buffer);
        view.setUint8(this.pointer++, byte);
    }

    public putBuffer(buffer: ArrayBuffer): void {
        this.update(buffer.byteLength);
        const u8Buf = new Uint8Array(this.buffer);
        u8Buf.set(new Uint8Array(buffer), this.pointer);
        this.pointer += buffer.byteLength;
    }
}

class DecodeCtx {
    public readonly buffer: ArrayBuffer;
    public pointer: number = 0;

    public constructor(buffer: ArrayBuffer) {
        this.buffer = buffer;
    }



    public getByte(): number {
        const view = new DataView(this.buffer);
        return view.getUint8(this.pointer++);
    }

    public getBuffer(length: number): ArrayBuffer {
        const slice = this.buffer.slice(this.pointer, this.pointer + length);
        this.pointer += length;
        return slice;
    }
}



export abstract class Parser<Type> {
    /* A signed 32-bit magic value used to detect if formats match. */
    public abstract readonly magic: number;

    public abstract encode(ctx: EncodeCtx, value: Type): void;
    public abstract decode(ctx: DecodeCtx): Type;

    public toBinary(value: Type): ArrayBuffer {
        const ctx = new EncodeCtx();
        ctx.putBuffer(new Uint32Array([ this.magic ]).buffer);
        this.encode(ctx, value);
        return ctx.final();
    }
    public fromBinary(buffer: ArrayBuffer): Type {
        const ctx = new DecodeCtx(buffer);
        const magic = new Uint32Array(ctx.getBuffer(4))[0];
        if(magic != this.magic) {
            throw new Error('Parser magic value does not match.');
        }
        return this.decode(ctx);
    }

    public toBase64(value: Type): string {
        return Base64.fromUint8Array(new Uint8Array(this.toBinary(value)));
    }
    public fromBase64(str: string): Type {
        return this.fromBinary(Base64.toUint8Array(str).buffer);
    }
}

export type ParserType<P extends Parser<any>> = P extends Parser<infer T> ? T : never;



class UsizeParser extends Parser<bigint> {
    public readonly magic: number = hashStr('UsizeParser');

    public encode(ctx: EncodeCtx, value: bigint): void {
        if(value == 0n) {
            ctx.putByte(0);
            return;
        }
        let remaining: bigint = value;
        while (remaining != 0n) {
            let encodedByte: number = Number(remaining & 0x7fn) | 0x80;
            remaining >>= 7n;
            if (remaining == 0n) {
                encodedByte &= 0x7f;
            }
            ctx.putByte(encodedByte);
        }
    }
    public decode(ctx: DecodeCtx): bigint {
        let value: bigint = 0n;
        let shift: bigint = 0n;
        let byte: number;
        do {
            byte = ctx.getByte();
            const encodedValue: bigint = BigInt(byte & 0x7f);
            value |= (encodedValue << shift);
            shift += 7n;
        } while ((byte & 0x80) != 0);
        return value;
    }
}
export function usize(): Parser<bigint> {
    return new UsizeParser();
}

class BinaryParser extends Parser<ArrayBuffer> {
    public readonly magic: number = hashStr('BinaryParser');

    public encode(ctx: EncodeCtx, buf: ArrayBuffer): void {
        usize().encode(ctx, BigInt(buf.byteLength));
        ctx.putBuffer(buf);
    }
    public decode(ctx: DecodeCtx): ArrayBuffer {
        const length: number = Number(usize().decode(ctx));
        return ctx.getBuffer(length);
    }
}
export function binary(): Parser<ArrayBuffer> {
    return new BinaryParser();
}

type NumType = 'u8' | 'u16' | 'u32' | 'i8' | 'i16' | 'i32' | 'f32' | 'f64';
class NumberParser extends Parser<number> {
    public readonly magic: number;
    public readonly type: NumType;

    public constructor(type: NumType) {
        super();
        this.type = type;
        this.magic = hashStr(`NumberParser:${this.type}`);
    }

    public encode(ctx: EncodeCtx, number: number): void {
        ctx.update(8);
        const view = new DataView(ctx.buffer);
        switch(this.type) {
            case 'u8': view.setUint8(ctx.pointer, number); ctx.pointer += 1; break;
            case 'u16': view.setUint16(ctx.pointer, number, true); ctx.pointer += 2; break;
            case 'u32': view.setUint32(ctx.pointer, number, true); ctx.pointer += 4; break;
            case 'i8': view.setInt8(ctx.pointer, number); ctx.pointer += 1; break;
            case 'i16': view.setInt16(ctx.pointer, number, true); ctx.pointer += 2; break;
            case 'i32': view.setInt32(ctx.pointer, number, true); ctx.pointer += 4; break;
            case 'f32': view.setFloat32(ctx.pointer, number); ctx.pointer += 4; break;
            case 'f64': view.setFloat64(ctx.pointer, number, true); ctx.pointer += 8; break;
            default: throw new Error('NumParser invalid type.');
        }
    }
    public decode(ctx: DecodeCtx): number {
        const view = new DataView(ctx.buffer);
        let number: number;
        switch(this.type) {
            case 'u8': number = view.getUint8(ctx.pointer); ctx.pointer += 1; break;
            case 'u16': number = view.getUint16(ctx.pointer, true); ctx.pointer += 2; break;
            case 'u32': number = view.getUint32(ctx.pointer, true); ctx.pointer += 4; break;
            case 'i8': number = view.getInt8(ctx.pointer); ctx.pointer += 1; break;
            case 'i16': number = view.getInt16(ctx.pointer, true); ctx.pointer += 2; break;
            case 'i32': number = view.getInt32(ctx.pointer, true); ctx.pointer += 4; break;
            case 'f32': number = view.getFloat32(ctx.pointer); ctx.pointer += 4; break;
            case 'f64': number = view.getFloat64(ctx.pointer, true); ctx.pointer += 8; break;
            default: throw new Error('NumParser invalid type.');
        }
        return number;
    }
}
export function number(type: NumType): Parser<number> {
    return new NumberParser(type);
}

class StringParser extends Parser<string> {
    public readonly magic: number = hashStr('StringParser');

    public encode(ctx: EncodeCtx, str: string): void {
        binary().encode(ctx, new TextEncoder().encode(str));
    }
    public decode(ctx: DecodeCtx): string {
        return new TextDecoder('utf-8').decode(binary().decode(ctx));
    }
}
export function string(): Parser<string> {
    return new StringParser();
}

class BooleanParser extends Parser<boolean> {
    public readonly magic: number = hashStr('BooleanParser');

    public encode(ctx: EncodeCtx, value: boolean): void {
        ctx.putByte(value ? 0x01 : 0x00);
    }
    public decode(ctx: DecodeCtx): boolean {
        switch(ctx.getByte()) {
            case 0x00: return false;
            case 0x01: return true;
            default: throw new Error('BooleanParser invalid boolean value.');
        }
    }
}
export function boolean(): Parser<boolean> {
    return new BooleanParser();
}

class NullableParser<T extends Parser<any>> extends Parser<ParserType<T> | null> {
    public readonly magic: number;
    public readonly type: T;

    public constructor(type: T) {
        super();
        this.type = type;
        this.magic = hashStr(`NullableParser:${this.type.magic}`);
    }

    public encode(ctx: EncodeCtx, value: ParserType<T> | null): void {
        if(value === null) {
            ctx.putByte(0x00);
        } else {
            ctx.putByte(0x01);
            this.type.encode(ctx, value);
        }
    }
    public decode(ctx: DecodeCtx): ParserType<T> | null {
        switch(ctx.getByte()) {
            case 0x00: return null;
            case 0x01: return this.type.decode(ctx);
            default: throw new Error('NullableParser invalid value.');
        }
    }
}
export function nullable<T extends Parser<any>>(type: T): Parser<ParserType<T> | null> {
    return new NullableParser(type);
}

class ObjectParser<O extends {[key: string]: Parser<any>}> extends Parser<{[key in keyof O]: ParserType<O[key]>}> {
    public readonly magic: number;
    public readonly objType: O;
    public readonly keys: (keyof O)[];

    public constructor(objType: O) {
        super();
        this.objType = objType;
        this.keys = (Object.keys(this.objType) as (keyof O)[]).toSorted();
        this.magic = hashStr(`StringParser:${this.keys.map(key => `${String(key)}-${this.objType[key].magic}`).join(',')}`);
    }

    public encode(ctx: EncodeCtx, obj: { [key in keyof O]: ParserType<O[key]>; }): void {
        for(const key of this.keys) {
            this.objType[key].encode(ctx, obj[key]);
        }
    }
    public decode(ctx: DecodeCtx): { [key in keyof O]: ParserType<O[key]>; } {
        let obj: {[key in keyof O]?: ParserType<O[key]>} = {};
        for(const key of this.keys) {
            obj[key] = this.objType[key].decode(ctx);
        }
        return obj as {[key in keyof O]: ParserType<O[key]>};
    }
}
export function object<O extends {[key: string]: Parser<any>}>(objType: O): Parser<{[key in keyof O]: ParserType<O[key]>}> {
    return new ObjectParser(objType);
}

class ArrayParser<A extends Parser<any>> extends Parser<ParserType<A>[]> {
    public readonly magic: number;
    public readonly arrType: A;

    public constructor(arrType: A) {
        super();
        this.arrType = arrType;
        this.magic = hashStr(`ArrayParser:${this.arrType.magic}`);
    }

    public encode(ctx: EncodeCtx, arr: ParserType<A>[]): void {
        usize().encode(ctx, BigInt(arr.length));
        for(const item of arr) {
            this.arrType.encode(ctx, item);
        }
    }
    public decode(ctx: DecodeCtx): ParserType<A>[] {
        const length: number = Number(usize().decode(ctx));
        const arr: ParserType<A>[] = [];
        for(let i = 0; i < length; i++) {
            arr.push(this.arrType.decode(ctx));
        }
        return arr;
    }
}
export function array<A extends Parser<any>>(type: A): Parser<ParserType<A>[]> {
    return new ArrayParser(type);
}

class RecordParser<K extends Parser<string | number>, V extends Parser<any>> extends Parser<Record<ParserType<K>, ParserType<V>>> {
    public readonly magic: number;
    public readonly keyType: K;
    public readonly valueType: V;

    public constructor(keyType: K, valueType: V) {
        super();
        this.keyType = keyType;
        this.valueType = valueType;
        this.magic = hashStr(`RecordParser:${this.keyType.magic}-${this.valueType.magic}`);
    }

    public encode(ctx: EncodeCtx, record: Record<ParserType<K>, ParserType<V>>): void {
        const entries = Object.entries(record);
        usize().encode(ctx, BigInt(entries.length));
        for(const [ key, value ] of entries) {
            this.keyType.encode(ctx, key);
            this.valueType.encode(ctx, value);
        }
    }
    public decode(ctx: DecodeCtx): Record<ParserType<K>, ParserType<V>> {
        // FIXME
        // @ts-ignore
        const entries: Record<ParserType<K>, ParserType<V>> = {};
        const numEntries: number = Number(usize().decode(ctx));
        for(let i = 0; i < numEntries; i++) {
            const key = this.keyType.decode(ctx);
            const value = this.valueType.decode(ctx);
            // @ts-ignore
            entries[key] = value;
        }
        return entries;
    }
}
export function record<K extends Parser<string | number>, V extends Parser<any>>(keyType: K, valueType: V): Parser<Record<ParserType<K>, ParserType<V>>> {
    return new RecordParser(keyType, valueType);
}

class DateParser extends Parser<Date> {
    public readonly magic: number = hashStr('DateParser');

    public encode(ctx: EncodeCtx, date: Date): void {
        usize().encode(ctx, BigInt(date.valueOf()));
    }
    public decode(ctx: DecodeCtx): Date {
        return new Date(Number(usize().decode(ctx)));
    }
}
export function date(): Parser<Date> {
    return new DateParser();
}

class PackedParser<P extends Parser<any>> extends Parser<ParserType<P>> {
    public readonly magic: number;
    public readonly parser: P;
    public readonly compressed: boolean;

    public constructor(parser: P, compressed: boolean) {
        super();
        this.parser = parser;
        this.compressed = compressed;
        this.magic = hashStr(`PackedParser:${this.parser.magic}:${this.compressed ? 'Compressed' : 'Uncompressed'}`);
    }

    public encode(ctx: EncodeCtx, value: ParserType<P>): void {
        const packedCtx = new EncodeCtx();
        this.parser.encode(packedCtx, value);
        let packed = packedCtx.final();
        if(this.compressed) {
            packed = Pako.deflate(packed).buffer;
        }
        binary().encode(ctx, packed);
    }
    public decode(ctx: DecodeCtx): ParserType<P> {
        let packed = binary().decode(ctx);
        if(this.compressed) {
            packed = Pako.inflate(packed).buffer;
        }
        const packedCtx = new DecodeCtx(packed);
        return this.parser.decode(packedCtx);
    }
}
export function packed<P extends Parser<any>>(parser: P, compressed: boolean): Parser<ParserType<P>> {
    return new PackedParser(parser, compressed);
}


