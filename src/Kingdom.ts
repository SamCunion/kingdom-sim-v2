/**
 * Kingdom class holds data on the distinct kingdoms. Each settlement or lord is linked to a kingdom.
 */

import { Utility } from "./lib/SRL";
import Settlement from "./Settlement";

export default class Kingdom {

    private readonly name: string;
    private readonly colour: string;
    private settlements: Settlement[] = [];

    /**
     * @param name the kingdoms name
     * @param colour the colour of the kingdom
     */
    constructor(name: string, colour: string) {
        this.name = name;
        this.colour = colour;
    }

    /**
     * Gets the kingdom's colour
     * @returns the colour in string rgb() format
     */
    public getColour(): string {
        return this.colour;
    }

    /**
     * Adds a settlement to the kingdom
     * @param settlement the settlement to add to the kingdom
     * @returns True of the operation was successful, else false
     */
    public addSettlement(settlement: Settlement): boolean {
        if (this.settlements.includes(settlement)) {
            console.error("Error, tried to add a settlement to a kingdom that already owns it.", settlement, this);
            return false;
        }
        this.settlements.push(settlement);
        settlement.setKingdom(this);
        return true;
    }
    /**
     * Removes the settlement from the kingdom
     * @param settlement the settlement to unlink from the kingdom
     * @returns true if the operation was successful, else false
     */
    public removeSettlement(settlement: Settlement): boolean {
        if (!this.settlements.includes(settlement)) {
            console.error("Error, tried to remove a settlement from a kingdom that doesnt own it.", settlement, this);
            return false;
        }
        Utility.array.removeItem(this.settlements, settlement);
        return true;
    }

}