/**
 * Cities are settlements that can be sieged and can act as home bases of lords without a castle or city of their own.
 */
import Kingdom from "./Kingdom";
import { Scene, Vector2 } from "./lib/SRL";
import { EngineInfo } from "./lib/SRL/Engine";
import Settlement from "./Settlement";

export default class City extends Settlement {

    public override node_id = "city";

    public readonly isCapital: boolean;

    private static cities : City[] = [];

    constructor(scene: Scene, name: string, capital?: boolean) {
        super(scene, name);
        this.isCapital = capital ?? false;

        if (this.isCapital) {
            this.setDimensions(new Vector2(25, 25));
        }
        else {
            this.setDimensions(new Vector2(20, 20));
        }

        City.cities.push(this);
    }

    //STATIC METHODS
    /**
     * Returns the list of cities
     * @returns the complete list of cities
     */
    public static getCities(): City[] {
        return this.cities;
    }

}