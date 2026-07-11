/**
 * A castle is like a city, but has less defences and lower overall value.
 */
import { Scene, Vector2 } from "./lib/SRL";
import Settlement from "./Settlement";


export default class Castle extends Settlement {

    public override node_id = "castle";

    private static castles: Castle[] = [];

    constructor(scene: Scene, name: string) {
        super(scene, name);

        this.setDimensions(new Vector2(12, 12));

        Castle.castles.push(this);
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