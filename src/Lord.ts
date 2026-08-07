import Battlefield from "./Battlefield";
import Inspector from "./Inspector";
import Kingdom from "./Kingdom";
import { Utility } from "./lib/TSRL";
import Settlement from "./Settlement";
import _ from "lodash";

/**
 * A lord is an autonomous unit that partakes in campaigns and holds a warband
 */
export default class Lord {

    private readonly KING_CAPACITY_RANGE = [350, 350];
    private readonly LORD_CAPACITY_RANGE = [50, 300, 125, 50]; //min, max, mean, std dev
    
    private static lords: Lord[] = [];

    public name: string;
    private kingdom!: Kingdom;
    public is_king: boolean;
    public warband_size: number = 0;
    public warband_size_cap: number = 0;
    public location!: Settlement; //the settlement the lord is currently at
    public in_field: boolean = false; //whether the lord is currently outside (in_field) or inside (!in_field) the settlement.
    public behaviour_state: LordBehaviour = LordBehaviour.RECOVER;
    public imprison_duration: number = 0;
    public imprisoned_by: Kingdom|null = null;

    constructor(name: string, starting_kingdom: Kingdom, isKing: boolean = false) {
        this.name = name;
        this.is_king = isKing;
        this.setKingdom(starting_kingdom);

        if (this.is_king) {
            this.name = "King " + name;
            let cap = Utility.random.randInt(this.KING_CAPACITY_RANGE[0], this.KING_CAPACITY_RANGE[1]);
            this.warband_size_cap = cap;
            this.warband_size = cap;
        }
        else {
            this.name = "Lord " + name;
            let cap = Utility.random.randGaussianInt(this.LORD_CAPACITY_RANGE[0], this.LORD_CAPACITY_RANGE[1], this.LORD_CAPACITY_RANGE[2], this.LORD_CAPACITY_RANGE[3]);
            this.warband_size_cap = cap;
            this.warband_size = cap;
        }

        Lord.lords.push(this);
    }

    /**
     * Called when its time for the lord to act. Determines the lord's best action to take this "turn" and then acts upon it.
     */
    public Act(): void {
        //get the current state
        let state = this.determineState();

        //check if freshly released
        if (state !== LordBehaviour.IMPRISONED && this.behaviour_state == LordBehaviour.IMPRISONED) {
            this.imprisoned_by = null;
            if (this.is_king) {
                Inspector.logNewMessage(`${this.name} of ${this.kingdom.name} was released from captivity.`);
            }
            //check if kingdom still exists
            if (this.kingdom.getOwnedSettlements().length > 0) {
                //return to a random friendly settlement
                if (!this.in_field) {
                    this.exitSettlement();
                }
                let s = Utility.random.randItem(this.kingdom.getOwnedSettlements());
                if (this.location !== s) {
                    this.moveTo(s, false);
                }
                this.enterSettlement();
            }
        }

        //if inside a non-besieged settlement, recover troops
        if (!this.in_field && !this.location.besieged) {
            this.warband_size += Utility.random.randInt(1, 3, true);
            if (this.warband_size > this.warband_size_cap) {
                this.warband_size = this.warband_size_cap;
            }
        }

        //check if the lord is inside a besieged settlement, if so, they cant do anything
        if (!this.in_field && this.location.besieged) {
            this.behaviour_state = state;
            return;
        }

        //determine best action based on the behaviour of the state
        switch (state) {
            
            case LordBehaviour.RECOVER: {

                //if inside, just recover
                if (!this.in_field) {
                    break;
                }

                //if outside a friendly settlement, enter it
                if (this.in_field && this.location.getKingdom() == this.getKingdom()) {
                    this.enterSettlement();
                    break;
                }

                //otherwise, navigate to the nearest friendly settlement
                let nearest_friendly = this.location.findNearest("friendly", this.getKingdom());
                let next_hop = this.location.dijkstra(nearest_friendly)[1];
                this.moveTo(next_hop);
                break;
            }

            case LordBehaviour.VENTURE: {
                //if in a friendly settlement, check if its safe to exit before leaving.
                if (!this.in_field) {
                    if (this.checkFightWorthJoining(this.location)) {
                        this.exitSettlement();
                    }
                    //otherwise, safer to stay inside.
                    break;
                }

                //if king, and the conditions are right, start a campaign by declaring a target
                if (this.warband_size == this.warband_size_cap && this.kingdom.wars.length > 0) {
                    //check if the average health across all lords is more than 75% of their capacity
                    let norm_capacity = this.kingdom.lords.map(l => l.warband_size / l.warband_size_cap);
                    let mean = _.mean(norm_capacity);
                    if (mean > 0.75) {
                        //conditions are satisfied, declare a campaign target
                        this.kingdom.current_target = this.location.findRandom("enemy", this.kingdom);
                        break;
                    }
                }

                //if not at war, venture towards a friendly settlement
                if (this.kingdom.wars.length == 0) {
                    let dest = Utility.random.randItem(this.kingdom.getOwnedSettlements());
                    //if the lord is already at the destination, do nothing this turn.
                    if (dest == this.location) {
                        break;
                    }
                    //otherwise, start to move towards the random location
                    let next_hop = this.location.dijkstra(dest)[1];
                    this.moveTo(next_hop);
                    break;
                }

                //====CAN NOW ASSUME IS AT WAR====

                //check if the lord is in danger where it currently is
                if (this.checkInDanger()) { //lord is in danger!
                    if (this.location.getKingdom() == this.getKingdom()) { //enter the settlement if its at a friendly one
                        this.enterSettlement();
                        break;
                    }

                    let nearest_friendly = this.location.findNearest("friendly", this.kingdom);
                    let next_hop = this.location.dijkstra(nearest_friendly)[1];
                    this.moveTo(next_hop);
                    break;
                }

                //lord is not in immediate danger, check if there are any favorable fights to join on adjoining vectors
                let war_kingdoms = this.kingdom.getKingdomsAtWar();
                let moved = false;
                for (let v of this.location.getConnections()) {
                    //check if there is infact enemies on that vector
                    if (moved) {
                        break;
                    }
                    for (let l of v.settlement2.field_lords) {
                        if (war_kingdoms.includes(l.getKingdom()) && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                            //there are enemies on this vector
                            if (this.checkFightWorthJoining(v.settlement2)) {
                                //its worth joining, so join it.
                                this.moveTo(v.settlement2);
                                moved = true;
                                break;
                            }
                        }
                    }
                }
                if (moved) {
                    break;
                }

                //no danger or favorable fights to join, move towards a random enemy settlement
                let rand_war_target = Utility.random.randItem(war_kingdoms);
                let rand_war_settlement = Utility.random.randItem(rand_war_target.getOwnedSettlements());
                if (rand_war_settlement == this.location) { //already at a random settlement, just sit this turn out.
                    break;
                }
                let next_hop = this.location.dijkstra(rand_war_settlement)[1];
                this.moveTo(next_hop);
                break;
            }

            case LordBehaviour.CAMPAIGN: {
                //if in a friendly settlement, check if its safe to exit before leaving.
                if (!this.in_field) {
                    if (this.checkFightWorthJoining(this.location)) {
                        this.exitSettlement();
                    }
                    //otherwise, safer to stay inside.
                    break;
                }

                //check if the lord is in danger where it currently is
                if (this.checkInDanger()) { //lord is in danger!
                    if (this.location.getKingdom() == this.getKingdom()) { //enter the settlement if its at a friendly one
                        this.enterSettlement();
                        break;
                    }

                    let nearest_friendly = this.location.findNearest("friendly", this.kingdom);
                    let next_hop = this.location.dijkstra(nearest_friendly)[1];
                    this.moveTo(next_hop);
                    break;
                }

                //lord is not in immediate danger, check if there are any favorable fights to join on adjoining vectors
                let war_kingdoms = this.kingdom.getKingdomsAtWar();
                let moved = false;
                for (let v of this.location.getConnections()) {
                    //check if there is infact enemies on that vector
                    if (moved) {
                        break;
                    }
                    for (let l of v.settlement2.field_lords) {
                        if (war_kingdoms.includes(l.getKingdom()) && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                            //there are enemies on this vector
                            if (this.checkFightWorthJoining(v.settlement2)) {
                                //its worth joining, so join it.
                                this.moveTo(v.settlement2);
                                moved = true;
                                break;
                            }
                        }
                    }
                }
                if (moved) {
                    break;
                }

                //otherwise, path towards campaign target
                if (this.location == this.kingdom.current_target) {
                    break;
                }
                let next_hop = this.location.dijkstra(this.kingdom.current_target!)[1];
                this.moveTo(next_hop);
                break;
            }

            case LordBehaviour.SIEGE: {
                //if the current settlement isnt already besieged, set it so
                if (!this.location.besieged) {
                    this.location.besieged = true;
                    Inspector.logNewMessage(`${this.location.name} has been besieged by ${this.kingdom.name}!`);
                }
                break;
            }
            
            case LordBehaviour.IMPRISONED: {
                this.imprison_duration--;
                break;
            }

        }

        //set the lords state
        this.behaviour_state = state;
    }

    public determineState(): LordBehaviour {
        let prev_state = this.behaviour_state;

        //based on previous state, and current observations, determine the lords current state
        switch(prev_state) {

            case LordBehaviour.RECOVER: {
                //if on same node as an enemy, transition to BATTLE state
                let wars = this.kingdom.getKingdomsAtWar();
                for (let l of this.location.field_lords) {
                    if (l.behaviour_state !== LordBehaviour.IMPRISONED && wars.includes(l.getKingdom())) {
                        return LordBehaviour.BATTLE;
                    }
                }

                //if max capacity and a campaign is active, transition to CAMPAIGN state
                if (this.warband_size == this.warband_size_cap && this.kingdom.current_target) {
                    return LordBehaviour.CAMPAIGN;
                }

                //if max capacity and there is no campaign active, transition to VENTURE state
                if (this.warband_size == this.warband_size_cap) {
                    return LordBehaviour.VENTURE;
                }

                //otherwise, transition to RECOVER
                return LordBehaviour.RECOVER;
            }

            case LordBehaviour.VENTURE: {
                //if on same node as an enemy, transition to BATTLE state
                let wars = this.kingdom.getKingdomsAtWar();
                for (let l of this.location.field_lords) {
                    if (l.behaviour_state !== LordBehaviour.IMPRISONED && wars.includes(l.getKingdom())) {
                        return LordBehaviour.BATTLE;
                    }
                }

                //if less than 25% capacity, transition to RECOVER state
                if (this.warband_size <= this.warband_size_cap / 4) {
                    return LordBehaviour.RECOVER;
                }

                //if theres a campaign active, transition to CAMPAIGN state
                if (this.kingdom.current_target) {
                    return LordBehaviour.CAMPAIGN;
                }

                //otherwise, transition to VENTURE
                return LordBehaviour.VENTURE;
            }

            case LordBehaviour.CAMPAIGN: {
                //if on same node as an enemy, transition to BATTLE state
                let wars = this.kingdom.getKingdomsAtWar();
                for (let l of this.location.field_lords) {
                    if (l.behaviour_state !== LordBehaviour.IMPRISONED && wars.includes(l.getKingdom())) {
                        return LordBehaviour.BATTLE;
                    }
                }

                //if less than 25% capacity, transition to RECOVER state
                if (this.warband_size <= this.warband_size_cap / 4) {
                    return LordBehaviour.RECOVER;
                }

                //if in campaign target, transition to SIEGE state
                if (this.kingdom.current_target == this.location) {
                    return LordBehaviour.SIEGE;
                }

                //if the campaign is over, transition to VENTURE state
                if (!this.kingdom.current_target) {
                    return LordBehaviour.VENTURE;
                }

                //otherwise, remain in CAMPAIGN state
                return LordBehaviour.CAMPAIGN;
            }

            case LordBehaviour.BATTLE: {
                //if on same node as an enemy, continue in BATTLE state
                let wars = this.kingdom.getKingdomsAtWar();
                for (let l of this.location.field_lords) {
                    if (l.behaviour_state !== LordBehaviour.IMPRISONED && wars.includes(l.getKingdom())) {
                        return LordBehaviour.BATTLE;
                    }
                }

                //if less than 25% capacity, transition to RECOVER state
                if (this.warband_size <= this.warband_size_cap / 4) {
                    return LordBehaviour.RECOVER;
                }

                //if theres a campaign active, transition to CAMPAIGN state
                if (this.kingdom.current_target) {
                    return LordBehaviour.CAMPAIGN;
                }

                //otherwise, transition to venture state
                return LordBehaviour.VENTURE;
            }

            case LordBehaviour.SIEGE: {
                //if in campaign target, continue in SIEGE state
                if (this.kingdom.current_target == this.location) {
                    return LordBehaviour.SIEGE;
                }

                //if in same settlement as an enemy, transition to BATTLE state
                let wars = this.kingdom.getKingdomsAtWar();
                for (let l of this.location.field_lords) {
                    if (l.behaviour_state !== LordBehaviour.IMPRISONED && wars.includes(l.getKingdom())) {
                        return LordBehaviour.BATTLE;
                    }
                }

                //if less than 25% capacity, transition to RECOVER state
                if (this.warband_size <= this.warband_size_cap / 4) {
                    return LordBehaviour.RECOVER;
                }

                //otherwise, transition to VENTURE
                return LordBehaviour.VENTURE;
            }

            case LordBehaviour.IMPRISONED: {
                //if the lord's imprison_duration > 0, remain imprisoned.
                if (this.imprison_duration > 0) {
                    return LordBehaviour.IMPRISONED;
                }

                //otherwise, set the lords state to RECOVER
                return LordBehaviour.RECOVER;
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
     * @param show_transition_particle whether to show the transition particle visual (default true)
     * @returns true if the operation was successful, else false
     */
    public moveTo(settlement: Settlement, show_transition_particle = true): boolean {
        if (this.location == settlement) {
            console.error("Unable to move the lord as they are currently at the settlement they wish to move to!", this.location, this);
            return false;
        }
        else if (this.location) {
            if (!this.in_field) {
                console.error("Unable to move the lord, as they are currently inside a settlement!", this.location, this);
                return false;
            }
            //remove the lord from their current location first
            Utility.array.removeItem(this.location.field_lords, this);
            //show the transition animation
            if (show_transition_particle) {
                this.location.addTransitionParticle(this, settlement);
            }
        }
        //then add them to the new settlement
        this.location = settlement;
        settlement.field_lords.push(this);
        return true;
    }

    /**
     * Checks whether the lord considers itself in danger, based on its allies and enemies on its current, and connected settlements.
     * @returns whether the lord is "safe" or not
     */
    public checkInDanger(): boolean {
        //check the lords current node, and the nodes reachable by vectors. If the enemy sum > ally sum, the lord is in danger.
        let war_kingdoms = this.kingdom.getKingdomsAtWar();
        let ally_sum = 0;
        let enemy_sum = 0;

        //current node (only need to check allies, as if there were enemies, there would already be a battle)
        for (let l of this.location.field_lords) {
            if (l.getKingdom() == this.getKingdom() && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                ally_sum += l.warband_size;
            }
        }

        //vector nodes
        for (let v of this.location.getConnections()) {
            let location = v.settlement2;
            for (let l of location.field_lords) {
                if (l.getKingdom() == this.getKingdom() && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                    ally_sum += l.warband_size;
                }
                else if (war_kingdoms.includes(l.getKingdom()) && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                    enemy_sum += l.warband_size;
                }
            }
        }

        //if there are less enemies, the lord is safe
        if (enemy_sum <= ally_sum) {
            return false;
        }
        return true;
    }

    /**
     * Checks whether a potential fight on a vector is worth taking
     * @param target the target settlement
     * @returns true if the fight is worth joining, else false
     */
    public checkFightWorthJoining(target: Settlement): boolean {
        //if the number of allies on the current node + target node outnumber the enemies on the target node, the fight is worth joining
        let war_kingdoms = this.kingdom.getKingdomsAtWar();
        let ally_sum = 0;
        let enemy_sum = 0;

        //check allies on current node
        for (let l of this.location.field_lords) {
            if (l.getKingdom() == this.getKingdom() && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                ally_sum += l.warband_size;
            }
        }

        //check target
        for (let l of target.field_lords) {
            if (l.getKingdom() == this.getKingdom() && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                ally_sum += l.warband_size;
            }
            else if (war_kingdoms.includes(l.getKingdom()) && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                enemy_sum += l.warband_size;
            }
        }

        //is it worth joining?
        if (ally_sum >= enemy_sum) {
            return true;
        }
        return false;
    }

    /**
     * Gets the list of all lords in the game
     * @returns the list of all lords in the game
     */
    public static getLords(): Lord[] {
        return this.lords;
    }

}

export enum LordBehaviour {
    RECOVER = 0,
    VENTURE = 1,
    CAMPAIGN = 2,
    BATTLE = 3,
    SIEGE = 4,
    IMPRISONED = 5
}