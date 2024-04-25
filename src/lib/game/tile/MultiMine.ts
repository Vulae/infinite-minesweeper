


// abstract class MultiMineTile extends Tile {
//     protected readonly _numMines: number;
//     protected _revealed: boolean = false;
//     protected _numFlags: number = 0;
//     protected readonly _numFlagsMax: number = 1;

//     public constructor(world: World, x: number, y: number, mines: number, maxMines: number) {
//         super(world, x, y);
//         this._numMines = mines;
//         this._numFlagsMax = maxMines;
//     }

//     public numMines(): number { return this._numMines; }
//     public numFlags(): number { return this._numFlags; }

//     public readonly searchPattern: { x: number, y: number }[] = [
//         { x: -1, y: 0 },
//         { x: -1, y: 1 },
//         { x: 0, y: 1 },
//         { x: 1, y: 1 },
//         { x: 1, y: 0 },
//         { x: 1, y: -1 },
//         { x: 0, y: -1 },
//         { x: -1, y: -1 }
//     ];

//     public flag(): void {
//         if(this._revealed) return;
//         this._numFlags++;
//         if(this._numFlags > this._numFlagsMax) {
//             this._numFlags = 0;
//         }
//     }

//     public reveal(): void {
//         if(this._numFlags > 0) return;
//         this._revealed = true;
//     }
// }


