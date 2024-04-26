
import { clampNormal } from "$lib/Util";
import type { ValidParticle } from "../particle/Particle";
import type { ValidTile } from "../tile/Tile";



export type SoundEffect = 'reveal' | 'unflag' | 'explosion';



export abstract class Theme {
    public abstract init(): Promise<void>;
    public abstract drawTile(ctx: CanvasRenderingContext2D, tile: ValidTile): void;
    public abstract drawParticle(ctx: CanvasRenderingContext2D, particle: ValidParticle): void;

    public abstract readonly soundEffects: {[key in SoundEffect]: { src: string, variation: number }};
    public volume: number = 1;

    public playSound(sound: SoundEffect, volume: number = 1): void {
        const soundEffect = this.soundEffects[sound];

        const finalVolume = clampNormal(volume * this.volume);
        if(finalVolume <= 0) return;

        const audio = document.createElement('audio');
        audio.src = soundEffect.src;
        audio.volume = finalVolume;
        // TODO: Use AudioCtx for more sound effect variation options.
        audio.playbackRate = 1 + Math.random() * soundEffect.variation;
        audio.preservesPitch = false;

        const onEnded = () => {
            audio.removeEventListener('ended', onEnded);
            audio.remove();
        }

        audio.addEventListener('ended', onEnded);

        audio.play();
    }
}


