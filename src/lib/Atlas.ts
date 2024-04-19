


export class TextureAtlas<Textures extends {
    [key: string]: [ number, number, number, number ];
}> {
    public readonly textures: Textures;

    public readonly src: string;
    public readonly img: HTMLImageElement;

    constructor(src: string, textures: Textures) {
        this.src = src;
        this.img = document.createElement('img');
        this.img.src = this.src;
        this.textures = textures;
    }

    public awaitLoad(): Promise<void> {
        return new Promise((resolve, reject) => {
            if(this.img.naturalWidth !== 0) {
                return resolve();
            }

            const onLoad = () => {
                this.img.removeEventListener('load', onLoad);
                this.img.removeEventListener('error', onError);
                resolve();
            }
            const onError = () => {
                this.img.removeEventListener('load', onLoad);
                this.img.removeEventListener('error', onError);
                reject();
            }

            this.img.addEventListener('load', onLoad);
            this.img.addEventListener('error', onError);
        });
    }

    public onLoad(callbackfn: (atlas: TextureAtlas<Textures>) => void): void {
        this.awaitLoad().then(() => callbackfn(this));
    }

    public draw(ctx: CanvasRenderingContext2D, texture: keyof Textures, x: number, y: number, width: number, height: number): void {
        const [ sx, sy, sw, sh ] = this.textures[texture];
        ctx.drawImage(this.img, sx, sy, sw, sh, x, y, width, height);
    }

}


