/**
 * A castle is like a city, but has less defences and lower overall value.
 */
import { Scene } from "./lib/SRL";
import Settlement from "./Settlement";


export default class Castle extends Settlement {

    constructor(scene: Scene, name: string) {
        super(scene, name);
    }


}