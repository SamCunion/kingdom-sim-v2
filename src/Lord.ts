import Battlefield from "./Battlefield";
import { Connection } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import { Utility } from "./lib/SRL";
import Settlement from "./Settlement";
import _ from "lodash";

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
    public behaviour_state: LordBehaviour = LordBehaviour.RECOVER;

    constructor(name: string, starting_kingdom: Kingdom, isKing: boolean = false) {
        this.name = name;
        this.is_king = isKing;
        this.setKingdom(starting_kingdom);

        //starting units
        let lord_starting_warband_range = [50, 100];
        if (this.is_king) {
            lord_starting_warband_range = [100, 150];
            this.name = "King " + this.name;
        }
        else {
            this.name = "Lord " + this.name;
        }
        this.warband_size = Utility.random.randInt(lord_starting_warband_range[0], lord_starting_warband_range[1], true);

        Lord.lords.push(this);
    }

    /**
     * Called when its time for the lord to act. Determines the lord's best action to take this "turn" and then acts upon it.
     */
    public Act(): void {
        //determine overall behaviour state

        //unlock locked behaviour types if not at war (war has just ended)
        if ((this.behaviour_state == LordBehaviour.BATTLE || this.behaviour_state == LordBehaviour.SIEGE || this.behaviour_state == LordBehaviour.MILI_CAMPAIGN) && this.kingdom.wars.length == 0) {
            this.behaviour_state = LordBehaviour.CAMPAIGN;
        }

        //if king, check if its time to start a military campaign
        if (this.is_king && this.warband_size > 100 && this.kingdom.wars.length > 0 && this.behaviour_state == LordBehaviour.CAMPAIGN) {
            let kingdom_lords = this.kingdom.lords;
            let kingdom_lord_warbands = kingdom_lords.map(l => l.warband_size);
            let kingdom_lord_warband_mean = _.mean(kingdom_lord_warbands);
            if (kingdom_lord_warband_mean > 50) { //conditions satisfied, initiate the military campaign
                //find campaign target
                this.kingdom.current_target = this.location.findRandom("enemy", this.kingdom);

                for (let l of this.kingdom.lords) { 
                    if (l.behaviour_state == LordBehaviour.CAMPAIGN) {
                        l.behaviour_state = LordBehaviour.MILI_CAMPAIGN;
                    }
                }
            }
        }

        if (this.is_king && this.warband_size < 50) { //if king and warband size is less than 50, go home to recover
            this.behaviour_state = LordBehaviour.RECOVER;
        }
        else if (this.warband_size < 25) { //if lord and warband size is less than 25, go home to recover
            this.behaviour_state = LordBehaviour.RECOVER;
        }
        else if (this.behaviour_state !== LordBehaviour.MILI_CAMPAIGN && this.behaviour_state !== LordBehaviour.SIEGE && this.behaviour_state !== LordBehaviour.BATTLE) { //if the lord/king has enough troups, and not on a mili campaign, battle, or siege, they enter campaign mode
            this.behaviour_state = LordBehaviour.CAMPAIGN;
        }


        switch (this.behaviour_state) {
            case LordBehaviour.CAMPAIGN:
                if (!this.in_field) {
                    this.exitSettlement();
                    return;
                }

                let war_kingdoms = [];
                for (let w of this.kingdom.wars) {
                    if (w.kingdoms[0] !== this.kingdom) {
                        war_kingdoms.push(w.kingdoms[0]);
                    }
                    else if (w.kingdoms[1] !== this.kingdom) {
                        war_kingdoms.push(w.kingdoms[1]);
                    }
                }

                //if not at war, path towards a random ally settlement
                if (this.kingdom.wars.length == 0) {
                    let rand_settlement = Utility.random.randItem(this.kingdom.getOwnedSettlements());
                    if (rand_settlement !== this.location) {
                        let pth = this.location.dijkstra(rand_settlement);
                        this.moveTo(pth[1]);
                        return;
                    }
                    else {
                        return;
                    }
                }
                else { //is at war, 
                    //FIRST, check connected nodes, and run "worth joining battle" calculation. If a connection satisfies it, move to that node through the connection
                    let current_node_vectors = this.location.getConnections();
                    for (let v of current_node_vectors) {
                        //sum enemies on that connection
                        let enemy_warband_total = 0;
                        for (let l of v.settlement2.field_lords) {
                            if (war_kingdoms.includes(l.kingdom)) {
                                enemy_warband_total += l.warband_size;
                            }
                        }
                        //sum allies on current tile + connection
                        let ally_warband_total = 0;
                        for (let l of v.settlement2.field_lords) {
                            if (l.kingdom == this.kingdom) {
                                ally_warband_total += l.warband_size;
                            }
                        }
                        for (let l of this.location.field_lords) {
                            if (l.kingdom == this.kingdom) {
                                ally_warband_total += l.warband_size;
                            }
                        }
                        //if allies are greater than enemies, goto that connection
                        if (ally_warband_total > enemy_warband_total) {
                            this.moveTo(v.settlement2);
                            return;
                        }
                    }

                    //next, sum each enemy lord warbands on all connections. If the sum is greater than the ally warband sum on the current tile, flee.
                    let ally_warband_total = 0;
                    let enemy_warband_total = 0;
                    for (let l of this.location.field_lords) {
                        if (l.kingdom == this.kingdom) {
                            ally_warband_total += l.warband_size;
                        }
                    }
                    for (let v of current_node_vectors) {
                        let v_l = v.settlement2.field_lords;
                        for (let l of v_l) {
                            if (war_kingdoms.includes(l.kingdom)) {
                                enemy_warband_total += l.warband_size;
                            }
                        }
                    }
                    if (ally_warband_total < enemy_warband_total) { //flee
                        let nearest_ally_settlement = this.location.findNearest("friendly", this.kingdom);
                        let next_step = this.location.dijkstra(nearest_ally_settlement)[1];
                        this.moveTo(next_step);
                        return;
                    }

                    //if none of the above actions are valid, pick a random enemy settlement and move towards it.
                    let rand_enemy_settlement = this.location.findRandom("enemy", this.kingdom);
                    if (rand_enemy_settlement) {
                        let next_step = this.location.dijkstra(rand_enemy_settlement)[1];
                        this.moveTo(next_step);
                        return;
                    }
                }
                break;
            case LordBehaviour.MILI_CAMPAIGN:
                //path towards target
                if (this.kingdom.current_target) {
                    let next_hop = this.location.dijkstra(this.kingdom.current_target)[1];
                    this.moveTo(next_hop);
                    if (this.location == this.kingdom.current_target) {
                        this.behaviour_state = LordBehaviour.SIEGE;
                        if (!this.location.besieged) {
                            this.location.besieged = true;
                        }
                    }
                }
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
            //show the transition animation
            this.location.addTransitionParticle(this, settlement);
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

enum LordBehaviour {
    RECOVER = 0,
    CAMPAIGN = 1,
    MILI_CAMPAIGN = 2,
    BATTLE = 3,
    SIEGE = 4
}