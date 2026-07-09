/**
 * A castle is like a city, but has less defences and lower overall value.
 */
import { Scene, Vector2 } from "./lib/SRL";
import Settlement from "./Settlement";


export default class Castle extends Settlement {

    constructor(scene: Scene, name: string) {
        super(scene, name);

        this.setDimensions(new Vector2(12, 12));
    }


}