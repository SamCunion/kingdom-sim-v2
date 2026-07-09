/**
 * Cities are settlements that can be sieged and can act as home bases of lords without a castle or city of their own.
 */
import Kingdom from "./Kingdom";
import { Scene, Vector2 } from "./lib/SRL";
import { EngineInfo } from "./lib/SRL/Engine";
import Settlement from "./Settlement";

export default class City extends Settlement {

    public readonly isCapital: boolean;

    constructor(scene: Scene, name: string, capital?: boolean) {
        super(scene, name);
        this.isCapital = capital ?? false;

        if (this.isCapital) {
            this.setDimensions(new Vector2(25, 25));
        }
        else {
            this.setDimensions(new Vector2(20, 20));
        }
    }

}