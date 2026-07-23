import Battlefield from "./Battlefield";
import { Connection } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import { Utility } from "./lib/SRL";
import Settlement from "./Settlement";

/**
 * A lord is an autonomous unit that partakes in campaigns and holds a warband
 */
export default class Lord {

    private static lords: Lord[] = [];

    public name: string;
    private kingdom!: Kingdom;
    public is_king: boolean;
    public warband_size: number = 0;
    public location!: Settlement; //the settlement the lord is currently at
    public in_field: boolean = false; //whether the lord is currently outside (in_field) or inside (!in_field) the settlement.
    public home!: Settlement; //the settlement considered the lord's "home"

    constructor(name: string, starting_kingdom: Kingdom, isKing: boolean = false) {
        this.name = name;
        this.is_king = isKing;
        this.setKingdom(starting_kingdom);
        Lord.lords.push(this);
    }

    /**
     * Called when its time for the lord to act. Determines the lord's best action to take this "turn" and then acts upon it.
     */
    public Act(): void {
        //dummy logic picks a random adjacent settlement and moves to it
        if (!this.in_field) {
            this.exitSettlement();
        }
        else {
            let destination = Utility.random.randItem(this.location.getConnections()).settlement2;
            this.moveTo(destination);
        }
    }

    /**
     * Assigns the lord to a new kingdom
     * @param kingdom the kingdom the lord should now be assigned to
     * @returns true if the operation was successful, else false
     */
    public setKingdom(kingdom: Kingdom): boolean {
        this.kingdom = kingdom;
        return this.kingdom.addLord(this);
    }
    public getKingdom(): Kingdom {
        return this.kingdom;
    }

    /**
     * Lord enters the settlement its currently at. Only possible if the settlement is of type castle/city and is of the same kingdom
     * @returns true if the operation was successful, else false
     */
    public enterSettlement(): boolean {
        if (this.location.getKingdom() != this.kingdom) {
            //lord is not in the same kingdom as the settlement, illegal operation
            return false;
        }
        else if (this.location instanceof Battlefield) {
            //cannot enter battlefields
            return false;
        }
        if (!this.location.field_lords.includes(this)) {
            //lord is not outside this settlement, how can it enter?
            console.error("Error, lord is trying to enter a settlement when they aren't already outside it", this.location, this);
            return false;
        }
        this.location.garrison_lords.push(this);
        Utility.array.removeItem(this.location.field_lords, this);
        this.in_field = false;
        return true;
    }

    /**
     * Lord exits its current settlement to return to the field. Only possible if the settlement is not under siege.
     * @returns true if the operation was successful, else false
     */
    public exitSettlement(): boolean {
        if (this.location.besieged) {
            //cannot exit this settlement as it's besieged
            return false;
        }
        else if (!this.location.garrison_lords.includes(this)) {
            //lord is not inside this settlement, how can it leave?
            console.error("Error, lord is trying to leave a settlement that they arent in!", this.location, this);
            return false;
        }
        this.location.field_lords.push(this);
        Utility.array.removeItem(this.location.garrison_lords, this);
        this.in_field = true;
        return true;
    }

    /**
     * Moves the lord to a new settlement
     * @param settlement the new settlement the lord is being moved to
     * @returns true if the operation was successful, else false
     */
    public moveTo(settlement: Settlement): boolean {
        if (this.location === settlement) {
            console.error("Unable to move the lord as they are currently at the settlement they wish to move to!", this.location, this);
            return false;
        }
        else if (this.location) {
            if (this.location.garrison_lords.includes(this)) {
                console.error("Unable to move the lord, as they are currently inside a settlement!", this.location, this);
                return false;
            }
            //remove the lord from their current location first
            Utility.array.removeItem(this.location.field_lords, this);
        }
        //then add them to the new settlement
        this.location = settlement;
        settlement.field_lords.push(this);
        return true;
    }

    /**
     * Gets the list of all lords in the game
     * @returns the list of all lords in the game
     */
    public static getLords(): Lord[] {
        return this.lords;
    }

}