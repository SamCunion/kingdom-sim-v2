import { ISpriteDef } from "./Spritesheet";
import { Vector2 } from "./Vector2";

export class Sprite {

    public source: HTMLImageElement;
    public bounds: IBounds|null = null;
    public drawnSprite: OffscreenCanvas;

    constructor(img: HTMLImageElement, def?: IBounds) {
        this.source = img;
        let size: Vector2;
        let offset: Vector2 = new Vector2(0, 0);
        if (def) {
            this.bounds = def;
            size = this.bounds.dimensions;
            offset = this.bounds.location;
        }
        else {
            size = new Vector2(img.naturalWidth, img.naturalHeight);
        }
        this.drawnSprite = new OffscreenCanvas(size.x, size.y);
        let ctx = this.drawnSprite.getContext("2d");
        ctx!.drawImage(img, offset.x, offset.y, size.x, size.y, 0, 0, size.x, size.y);
    }


}

export interface IBounds {
    location: Vector2,
    dimensions: Vector2
}