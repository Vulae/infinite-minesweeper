import { awaitImageLoad } from './image';

interface CanvasStoreCanvasProps {
    size?: { width: number; height: number };
}

interface CanvasStoreContextProps {
    imageSmoothing?: boolean;
}

export class CanvasStore {
    private _canvas: HTMLCanvasElement | null = null;
    private _ctx: CanvasRenderingContext2D | null = null;

    private readonly props: CanvasStoreCanvasProps & CanvasStoreContextProps;

    public constructor(canvas: HTMLCanvasElement, props?: CanvasStoreContextProps);
    public constructor(props: CanvasStoreCanvasProps & CanvasStoreContextProps);
    public constructor();
    public constructor(
        arg: HTMLCanvasElement | (CanvasStoreCanvasProps & CanvasStoreContextProps) | null = null,
        arg2?: CanvasStoreContextProps
    ) {
        if (arg instanceof HTMLCanvasElement) {
            this._canvas = arg;
            this.props = arg2 ?? {};
        } else {
            this.props = arg ?? {};
        }
    }

    public get canvas(): HTMLCanvasElement {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            if (this.props.size) {
                this._canvas.width = this.props.size.width;
                this._canvas.height = this.props.size.height;
            }
        }
        return this._canvas;
    }

    public get ctx(): CanvasRenderingContext2D {
        if (!this._ctx) {
            this._ctx = this.canvas.getContext('2d');
            if (this._ctx === null) {
                throw new Error('Canvas rendering context 2d not supported in your browser.');
            }
            if (this.props.imageSmoothing !== undefined) {
                this._ctx.imageSmoothingEnabled = this.props.imageSmoothing;
            }
        }
        return this._ctx;
    }
}

export class TextureAtlas<
    Textures extends { readonly [key: string]: [number, number, number, number] }
> {
    private readonly textures: Textures;

    private loading: HTMLImageElement | null = null;
    private store: CanvasStore | null = null;

    private getStore(): CanvasStore {
        if (this.store === null) {
            throw new Error(
                'TextureAtlas texture not loaded yet, call TextureAtlas.awaitLoad to load it.'
            );
        }
        return this.store;
    }

    public constructor(textures: Textures, imageUrl: string);
    public constructor(textures: Textures, image: HTMLImageElement);
    public constructor(textures: Textures, canvas: HTMLCanvasElement);
    public constructor(textures: Textures, imageData: ImageData);
    public constructor(
        textures: Textures,
        arg: string | HTMLImageElement | HTMLCanvasElement | ImageData
    ) {
        this.textures = textures;
        if (typeof document == 'undefined') {
            return;
        }
        if (typeof arg == 'string') {
            const image = document.createElement('img');
            image.src = arg;
            this.loading = image;
        } else if (arg instanceof ImageData) {
            this.store = new CanvasStore({ size: { width: arg.width, height: arg.height } });
            this.store.ctx.imageSmoothingEnabled = false;
            this.store.ctx.putImageData(arg, 0, 0);
        } else if (arg instanceof HTMLCanvasElement) {
            this.store = new CanvasStore(arg);
        } else if (arg instanceof HTMLImageElement) {
            this.loading = arg;
        } else {
            throw new Error('TextureAtlas constructor invalid arguments.');
        }
    }

    public async awaitLoad(): Promise<void> {
        if (!this.loading) return;
        if (this.store) return;

        await awaitImageLoad(this.loading);

        this.store = new CanvasStore({
            size: {
                width: this.loading.naturalWidth,
                height: this.loading.naturalHeight
            }
        });
        this.store.ctx.imageSmoothingEnabled = false;
        this.store.ctx.drawImage(this.loading, 0, 0);
        this.loading = null;
    }

    public getTextureImageData(texture: keyof Textures): ImageData {
        const [x, y, width, height] = this.textures[texture];
        return this.getStore().ctx.getImageData(x, y, width, height);
    }

    public drawTexture(
        ctx: CanvasRenderingContext2D,
        texture: keyof Textures,
        x: number = 0,
        y: number = 0,
        width: number = 1,
        height: number = 1
    ): void {
        const [tx, ty, tWidth, tHeight] = this.textures[texture];
        return ctx.drawImage(this.getStore().canvas, tx, ty, tWidth, tHeight, x, y, width, height);
    }
}
