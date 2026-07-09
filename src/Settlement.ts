/**
 * Settlement class defines default behaviour for different settlement types
 */

import Kingdom from "./Kingdom";
import {Component, Scene, SolidRenderer, Vector2} from "./lib/SRL";

export default abstract class Settlement extends Component {

    private kingdom: Kingdom|null = null;
    private name: string;

    private static settlements: Settlement[] = [];

    constructor(scene: Scene, name: string) {
        super(scene);
        this.name = name;

        //set its initial location very far away, helps with graph generation
        this.setLocation(new Vector2(-100000, -100000));

        Settlement.settlements.push(this);
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

    //===STATIC METHODS===
    /**
     * Gets the list of all created settlements
     * @returns a list of settlements
     */
    public static getSettlements(): Settlement[] {
        return this.settlements;
    }


}