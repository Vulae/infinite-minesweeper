export class DataReader {
    private readonly data: ArrayBuffer;
    private pointer: number = 0;

    public constructor(data: ArrayBuffer) {
        this.data = data;
    }

    public read(length: number): Uint8Array {
        if (this.pointer + length > this.data.byteLength) {
            throw new Error('DataReader unexpected EOF');
        }
        const buf = new Uint8Array(this.data.slice(this.pointer, this.pointer + length));
        this.pointer += length;
        return buf;
    }

    public read_u8(): number {
        return this.read(1)[0];
    }

    private read_bigint(): bigint {
        let byte = this.read_u8();
        let value = BigInt(byte & 0b00111111);
        const negative = (byte & 0b01000000) != 0;
        let shift = 6n;

        while ((byte & 0b10000000) != 0) {
            byte = this.read_u8();
            value |= BigInt(byte & 0b01111111) << shift;
            shift += 7n;
        }

        return negative ? -value : value;
    }

    public read_int(): number {
        return Number(this.read_bigint());
    }

    public read_string(): string {
        const writer = new DataWriter(64);
        while (true) {
            const byte = this.read_u8();
            if (byte == 0x00) {
                break;
            }
            writer.write_u8(byte);
        }
        return new TextDecoder('utf-8').decode(writer.final());
    }
}

export class DataWriter {
    private data: ArrayBuffer;
    private pointer: number = 0;

    public constructor(hintLength: number = 256) {
        this.data = new ArrayBuffer(hintLength);
    }

    public final(): ArrayBuffer {
        return this.data.slice(0, this.pointer);
    }

    public write(buf: Uint8Array): void {
        if (this.pointer + buf.byteLength > this.data.byteLength) {
            const old = this.data;
            this.data = new ArrayBuffer(old.byteLength * 2 + buf.byteLength);
            new Uint8Array(this.data).set(new Uint8Array(old), 0);
        }
        new Uint8Array(this.data).set(buf, this.pointer);
        this.pointer += buf.byteLength;
    }

    public write_u8(num: number): void {
        if (!Number.isInteger(num) || num < 0 || num > 255) {
            throw new Error('DataWriter attempted to write invalid u8');
        }
        this.write(new Uint8Array([num]));
    }

    private write_bigint(num: bigint): void {
        const negative = num < 0n;
        num = negative ? -num : num;

        this.write_u8(
            (num > 0b00111111n ? 0b10000000 : 0) |
                (negative ? 0b01000000 : 0) |
                Number(num & 0b00111111n)
        );
        num >>= 6n;

        while (num > 0) {
            this.write_u8((num > 0b01111111n ? 0b10000000 : 0) | Number(num & 0b01111111n));
            num >>= 7n;
        }
    }

    public write_int(num: number): void {
        if (!Number.isInteger(num)) {
            throw new Error('DataWriter attempted to write invalid int');
        }
        this.write_bigint(BigInt(num));
    }

    public write_string(str: string): void {
        this.write(new TextEncoder().encode(str));
        this.write_u8(0x00);
    }
}

export class BitReader {
    private readonly reader: DataReader;

    public constructor(data: ArrayBuffer) {
        this.reader = new DataReader(data);
    }

    private index: number = 7;
    private byte: number = 0;

    public read_bit(): boolean {
        if (this.index >= 7) {
            this.index = 0;
            this.byte = this.reader.read_u8();
        }
        const bit = (this.byte & (1 << this.index)) != 0;
        this.index++;
        return bit;
    }

    public read_num(max: number): number {
        if (!Number.isInteger(max) || max < 1) {
            throw new Error('BitReader invalid max argument');
        }
        const bits = Math.log2(max + 1);
        let value = 0;
        for (let i = 0; i < bits; i++) {
            value |= (this.read_bit() ? 1 : 0) << i;
        }
        if (value > max) {
            throw new Error('BitReader number is greater than the max number');
        }
        return value;
    }
}

export class BitWriter {
    private readonly writer: DataWriter;

    public constructor(hintLength: number = 256) {
        this.writer = new DataWriter(hintLength);
    }

    private index: number = 0;
    private byte: number = 0;

    private flush(): void {
        if (this.index == 0) return;
        this.writer.write_u8(this.byte);
        this.index = 0;
        this.byte = 0;
    }

    public final(): ArrayBuffer {
        this.flush();
        return this.writer.final();
    }

    public write_bit(bit: boolean): void {
        if (bit) {
            this.byte |= 1 << this.index;
        }
        this.index++;
        if (this.index >= 7) {
            this.flush();
        }
    }

    public write_num(max: number, num: number): void {
        if (!Number.isInteger(max) || max < 1) {
            throw new Error('BitWriter invalid max argument');
        }
        if (!Number.isInteger(num) || num < 0) {
            throw new Error('BitWriter attempted to write invalid number');
        }
        if (num > max) {
            throw new Error('BitWriter number is greater than the max number');
        }
        const bits = Math.log2(max + 1);
        for (let i = 0; i < bits; i++) {
            this.write_bit(((num >> i) & 1) != 0);
        }
    }
}
