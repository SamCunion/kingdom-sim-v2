import { Sprite } from "./Sprite";
import { Vector2 } from "./Vector2";

export class Spritesheet {
    
    private sprites!: Array<ISpriteEntry>;
    private source: HTMLImageElement;

    constructor(img: HTMLImageElement) {
        this.source = img;
    }

    /**
     * Defines a set of sprites on the spritesheet.
     * @param spritedefs array of objects containing the sprite names, x, y, w and h locations on the spritesheet.
     */
    public defineSprites(spritedefs: ISpriteDef[]) {
        this.sprites = [];
        for (let i = 0; i < spritedefs.length; i++) {
            let obj = spritedefs[i];
            this.sprites.push({name: obj.name, object: new Sprite(this.source, {location: new Vector2(obj.x, obj.y), dimensions: new Vector2(obj.w, obj.h)})});
        }
    }

    /**
     * Creates sprites from the spritesheet if the sprites all have the same dimensions
     * @param start_location top left location of the top left sprite
     * @param dimensions height and width of the sprites
     * @param names list of the names that are given to each of the sprites
     * @param xGap horizontal gap between the sprites if there is any
     * @param yGap vertical gap between the sprites if there is any
     */
    public splitEvery(start_location: Vector2, dimensions: Vector2, names: string[], xGap?: number, yGap?: number) {
        this.sprites = [];
        const startX = start_location.x;
        const startY = start_location.y;
        const sourceH = this.source.height;
        const sourceW = this.source.width;
        if (!xGap) {
            xGap = 0;
        }
        if (!yGap) {
            yGap = 0;
        }

        let currX = startX;
        let currY = startY;
        let finished = false;
        let spriteNo = 0;
        while (!finished) {
            this.sprites.push({name: names[spriteNo], object: new Sprite(this.source, {location: new Vector2(currX, currY), dimensions: dimensions})});

            currX += dimensions.x + xGap;
            if (currX == sourceW) { //new row
                currY += dimensions.y + yGap;
                currX = startX;
                if (currY == sourceH) { //fin
                    finished = true;
                }
            }
            spriteNo++;
        }
    }

    /**
     * Gets the list of sprites defined on the spritesheet
     * @returns the list of sprites defined on the spritesheet
     */
    public getSprites(): ISpriteEntry[] {
        return this.sprites;
    }

    /**
     * Returns a sprite with the given name
     * @param name the name of the sprite
     * @returns a sprite with the given name or null if not found
     */
    public getSprite(name: string): Sprite|null {
        for (let i = 0; i < this.sprites.length; i++) {
            if (this.sprites[i].name == name) {
                return this.sprites[i].object;
            }
        }
        return null;
    }
}

export interface ISpriteDef {
    name: string,
    x: number,
    y: number,
    w: number,
    h: number
}

interface ISpriteEntry {
    name: string,
    object: Sprite
}