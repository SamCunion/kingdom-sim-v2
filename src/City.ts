/**
 * Cities are settlements that can be sieged and can act as home bases of lords without a castle or city of their own.
 */
import Kingdom from "./Kingdom";
import { Scene } from "./lib/SRL";
import Settlement from "./Settlement";

export default class City extends Settlement {

    public readonly isCapital: boolean;

    constructor(scene: Scene, name: string, kingdom: Kingdom, capital?: boolean) {
        super(scene, name);
        this.isCapital = capital ?? false;
    }

}