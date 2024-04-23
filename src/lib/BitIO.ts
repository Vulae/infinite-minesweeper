


export class BitIO {
    public buffer: ArrayBuffer;
    public get view(): DataView { return new DataView(this.buffer); }

    public constructor(byteLength: number);
    public constructor(buffer: ArrayBuffer);
    public constructor(data: number | ArrayBuffer) {
        // @ts-ignore
        this.buffer = typeof data == 'number' ? new ArrayBuffer(data) : ('buffer' in data ? data.buffer : data);
    }

    public bytePointer: number = 0;
    public bitPointer: number = 0;

    public skipBits(numBits: number): void {
        // TODO: Use binary operations here.
        this.bitPointer += numBits;
        this.bytePointer += Math.floor(this.bitPointer / 8);
        this.bitPointer %= 8;
    }

    public final(): ArrayBuffer {
        return this.buffer.slice(0, (this.bitPointer == 0) ? this.bytePointer : (this.bytePointer + 1));
    }



    public readBit(): boolean {
        const byte = this.view.getUint8(this.bytePointer);
        const bit = ((byte >> this.bitPointer) & 0b1) != 0;
        this.skipBits(1);
        return bit;
    }

    public readBits(numBits: number): number {
        let value = 0;
        for(let i = 0; i < numBits; i++) {
            value |= (this.readBit() ? 0b1 : 0b0) << i;
        }
        return value;
    }



    public writeBit(bit: boolean): void {
        let byte = this.view.getUint8(this.bytePointer);
        if(bit) {
            byte |= 0b1 << this.bitPointer;
        } else {
            byte &= (0b1 << this.bitPointer) ^ 0xFF;
        }
        this.view.setUint8(this.bytePointer, byte);
        this.skipBits(1);
    }

    public writeBits(numBits: number, value: number): void {
        for(let i = 0; i < numBits; i++) {
            this.writeBit((value & 0b1) != 0);
            value >>= 1;
        }
    }

}


