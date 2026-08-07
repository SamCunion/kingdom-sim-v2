/**
 * Cities are settlements that can be sieged and can act as home bases of lords without a castle or city of their own.
 */
import Kingdom from "./Kingdom";
import { Scene, Utility, Vector2 } from "./lib/TSRL";
import { EngineInfo } from "./lib/TSRL/Engine";
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

        this.resetGarrison();
        City.cities.push(this);
    }

    /**
     * Resets the cities garrison back to within the predefined limits
     */
    public override resetGarrison(): void {
        const garrison_limits = [300, 400];
        this.garrison = Utility.random.randInt(garrison_limits[0], garrison_limits[1], true);
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