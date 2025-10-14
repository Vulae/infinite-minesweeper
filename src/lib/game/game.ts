import { SaveManager } from './save';
import { World } from './world';

export class Game {
    public readonly world: World;
    public readonly saveManager: SaveManager;

    public constructor(saveSlot: string = 'save') {
        this.world = SaveManager.load(saveSlot);
        this.saveManager = new SaveManager(this, saveSlot);
    }
}
