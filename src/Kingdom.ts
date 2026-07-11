/**
 * Kingdom class holds data on the distinct kingdoms. Each settlement or lord is linked to a kingdom.
 */

import Castle from "./Castle";
import City from "./City";
import { Utility } from "./lib/SRL";
import Settlement from "./Settlement";

export default class Kingdom {

    private readonly name: string;
    private capital: City|null = null;
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
        if (settlement instanceof City && settlement.isCapital && this.capital == null) {
            this.capital = settlement;
        }
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

    /**
     * Returns the original capital of the kingdom
     * @returns the capital city
     */
    public getCapital(): City {
        return this.capital!;
    }

    /**
     * Gets the list of settlements that the kingdom owns
     * @returns the settlements currently associated with the kingdom
     */
    public getOwnedSettlements(): Settlement[] {
        return this.settlements;
    }

    /**
     * Gets the list of cities currently owned by this kingdom
     * @returns the list of cities
     */
    public getCities(): City[] {
        let out = [];
        for (let s of this.settlements) {
            if (s instanceof City) {
                out.push(s);
            }
        }
        return out;
    }

    /**
     * Gets the list of castles currently owned by this kingdom
     * @returns the list of castles
     */
    public getCastles(): Castle[] {
        let out = [];
        for (let s of this.settlements) {
            if (s instanceof Castle) {
                out.push(s);
            }
        }
        return out;
    }

}