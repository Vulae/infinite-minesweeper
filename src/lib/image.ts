export function awaitImageLoad(img: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
        if (img.complete && img.naturalWidth !== 0) {
            resolve();
        }

        const onLoad = () => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            resolve();
        };

        const onError = (err: ErrorEvent) => {
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            reject(err);
        };

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);
    });
}

export async function loadImage(src: string | HTMLImageElement): Promise<HTMLImageElement> {
    let img: HTMLImageElement;
    if (typeof src == 'string') {
        img = new Image();
        img.src = src;
    } else {
        img = src;
    }

    await awaitImageLoad(img);

    return img;
}

export function toImageData(image: HTMLImageElement): ImageData | null {
    if (!image.complete || image.naturalWidth === 0) {
        return null;
    }
    const canvas = new OffscreenCanvas(image.naturalWidth, image.naturalHeight);
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
}
