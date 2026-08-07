/**
 * A castle is like a city, but has less defences and lower overall value.
 */
import { Scene, Utility, Vector2 } from "./lib/TSRL";
import Settlement from "./Settlement";


export default class Castle extends Settlement {

    public override node_id = "castle";

    private static castles: Castle[] = [];

    constructor(scene: Scene, name: string) {
        super(scene, name);

        this.setDimensions(new Vector2(12, 12));
        this.resetGarrison();
        Castle.castles.push(this);
    }

    /**
     * Restocks the castles garrison back to the predetermined limits
     */
    public override resetGarrison(): void {
        const garrison_size_limits = [150, 250];
        this.garrison = Utility.random.randInt(garrison_size_limits[0], garrison_size_limits[1], true);
    }

    //STATIC METHODS
    /**
     * Returns the list of castles
     * @returns the complete list of castles
     */
    public static getCastles(): Castle[] {
        return this.castles;
    }

}