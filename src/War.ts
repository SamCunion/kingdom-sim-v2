/**
 * War class represents an ongoing conflict between two kingdoms.
 */

import Kingdom from "./Kingdom";
import { Utility } from "./lib/SRL";

export default class War {

    private readonly WAR_MIN_LENGTH = 100;
    private readonly WAR_MAX_LENGTH = 250;

    public kingdoms: Kingdom[] = [];
    public duration: number = 0;
    public peace_deadline: number;

    constructor(k1: Kingdom, k2: Kingdom) {
        this.kingdoms.push(k1);
        this.kingdoms.push(k2);

        //set peace deadline
        this.peace_deadline = Utility.random.randInt(this.WAR_MIN_LENGTH, this.WAR_MAX_LENGTH);
    }

}