import { World } from './world';

export class Game {
    public readonly world: World;

    constructor() {
        this.world = new World();
    }
}
