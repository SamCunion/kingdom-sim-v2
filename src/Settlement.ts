/**
 * Settlement class defines default behaviour for different settlement types
 */

import Kingdom from "./Kingdom";
import {Component, Scene, SolidRenderer} from "./lib/SRL";

export default abstract class Settlement extends Component {

    private kingdom: Kingdom|null = null;
    private name: string;

    constructor(scene: Scene, name: string) {
        super(scene);
        this.name = name;
    }

    /**
     * Gets the kingdom that owns this settlement
     * @returns the settlement's current kingdom
     */
    public getKingdom(): Kingdom|null {
        return this.kingdom;
    }
    /**
     * Assigns the settlement to the new kingdom
     * @param kingdom the new kingdom owner of the settlement
     */
    public setKingdom(kingdom: Kingdom): boolean {
        this.Renderer = new SolidRenderer(kingdom.getColour());
        this.kingdom = kingdom;
        return true;
    }


}