/**
 * Singleton WarHandler class acts as a factory class and determines who's at war, which wars start, when they should end
 */

import _ from "lodash";
import Castle from "./Castle";
import City from "./City";
import Kingdom from "./Kingdom";
import { Utility } from "./lib/TSRL";
import War from "./War";
import Inspector from "./Inspector";
import { LordBehaviour } from "./Lord";

export default class WarHandler {

    private readonly CHECK_WAR_START_INTERVAL: number = 100;

    private wars: War[] = [];
    private kingdoms: Kingdom[];
    private total_steps: number = 0;

    constructor(kingdoms: Kingdom[]) {
        this.kingdoms = kingdoms;
    }

    /**
     * Gets the list of ongoing wars
     * @returns the list of wars
     */
    public getWars(): War[] {
        return this.wars;
    }

    /**
     * Starts a war between two kingdoms
     * @param k1 the first kingdom
     * @param k2 the second kingdom
     * @returns True if the operation was successful, else false
     */
    public declareWar(k1: Kingdom, k2: Kingdom, reason_text: string): boolean {
        if (this.isAtWar(k1, k2)) {
            console.error("Error: attempted to start a war between two kingdoms already at war", k1, k2);
            return false;
        }
        else if (k1 == k2) {
            console.error("Error: attempted to start a war between the same kingdom", k1);
            return false;
        }
        //create new war
        let war = new War(k1, k2);
        //add the war to each kingdoms instance
        k1.wars.push(war);
        k2.wars.push(war);
        //add the war to the classes war array
        this.wars.push(war);
        Inspector.logNewMessage(`${k1.name} declared war on ${k2.name} over ${reason_text}.`);
        //display to console
        console.log(`%c${k1.name}%c declared war on %c${k2.name}%c over ${reason_text}.`, `color:${k1.colour};font-size:20px;font-weight:bolder;`, `color:black;font-size:15px;`, `color:${k2.colour};font-size:20px;font-weight:bolder;`, `color:black;font-size:15px;`);
        console.log(`%c${k1.name}%c is now at war with ${k1.wars.length} kingdoms.`, `color:${k1.colour};`, "color: black");
        console.log(`%c${k2.name}%c is now at war with ${k2.wars.length} kingdoms.`, `color:${k2.colour};`, "color: black");
        return true;
    }

    /**
     * Makes peace between two kingdoms
     * @param w the ongoing war
     * @returns true if the operation was successful, else false
     */
    public makePeace(w: War) : boolean {
        if (!this.wars.includes(w)) {
            console.error("Error, attempted to make peace between two kingdoms not at war!", w, w.kingdoms);
            return false;
        }
        //remove sieges and targets
        if (w.kingdoms[0].current_target?.getKingdom() == w.kingdoms[1]) {
            w.kingdoms[0].current_target.besieged = false;
            w.kingdoms[0].current_target = null;
        }
        if (w.kingdoms[1].current_target?.getKingdom() == w.kingdoms[0]) {
            w.kingdoms[1].current_target.besieged = false;
            w.kingdoms[1].current_target = null;
        }
        //free lords
        for (let l of w.kingdoms[0].lords) {
            if (l.imprisoned_by == w.kingdoms[1]) { //free
                l.imprisoned_by = null;
                l.imprison_duration = 0;
                l.behaviour_state = LordBehaviour.RECOVER;
            }
        }
        for (let l of w.kingdoms[1].lords) {
            if (l.imprisoned_by == w.kingdoms[0]) { //free
                l.imprisoned_by = null;
                l.imprison_duration = 0;
                l.behaviour_state = LordBehaviour.RECOVER;
            }
        }
        Utility.array.removeItem(this.wars, w);
        Utility.array.removeItem(w.kingdoms[0].wars, w);
        Utility.array.removeItem(w.kingdoms[1].wars, w);
        Inspector.logNewMessage(`${w.kingdoms[0].name} made peace with ${w.kingdoms[1].name}`);
        //log to console
        console.log(`%c${w.kingdoms[0].name}%c made peace with %c${w.kingdoms[1].name}`, `color:${w.kingdoms[0].colour};font-size:20px`, `color:silver;font-size:15px;`, `color:${w.kingdoms[1].colour};font-size:20px;font-weight:bolder;`);
        console.log(`%c${w.kingdoms[0].name}%c is now at war with ${w.kingdoms[0].wars.length} kingdoms.`, `color:${w.kingdoms[0].colour};`, "color: black");
        console.log(`%c${w.kingdoms[1].name}%c is now at war with ${w.kingdoms[1].wars.length} kingdoms.`, `color:${w.kingdoms[1].colour};`, "color: black");
        return true;
    }

    /**
     * Returns true if the kingdoms are at war, else false
     * @param k1 the first kingdom
     * @param k2 the second kingdom
     * @returns true if the kingdoms are at war, else false
     */
    public isAtWar(k1: Kingdom, k2: Kingdom): boolean {
        for (let w of this.wars) {
            if (w.kingdoms.includes(k1) && w.kingdoms.includes(k2)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Adds 1 to each wars duration
     */
    public Step(): void {

        //check war ends
        for (let w of this.wars) {
            w.duration++;

            if (w.duration > w.peace_deadline) { //end war
                this.makePeace(w);
            }
        }

        //check war starts
        if (this.total_steps % this.CHECK_WAR_START_INTERVAL == 0) {
            for (let kingdom of this.kingdoms) {
                if (kingdom.defeated) {
                    continue;
                }
                let n_ongoing_wars = kingdom.wars.length;
                let chance = 0.2 / Math.pow(2, n_ongoing_wars); //20% chance with no ongoing wars, 10% chance with 1 ongoing war, 5% chance with 2 ongoing wars etc.
                if (chance > Math.random()) {
                    //start a war
                    if (Math.random() > 0.5) { //start a war with a faction based on strength
                        //the kingdom wants to start a war with either a super strong faction, or a pathetically weak one.
                        //as a result, higher probabilities for a war to start are indicated by distance from the mean
                        let fac_str_totals = [];
                        let war_candidates = [];
                        for (let i = 0; i < this.kingdoms.length; i++) {
                            let k = this.kingdoms[i];
                            if (k == kingdom || k.defeated) {
                                continue;
                            }
                            let local_tot = 0;
                            let fiefs = k.getOwnedSettlements();
                            for (let f of fiefs) {
                                if (f instanceof Castle) {
                                    local_tot += f.strategic_value; //castles are worth 1
                                }
                                else if (f instanceof City) {
                                    local_tot += f.strategic_value; //cities are worth 2
                                }
                            }
                            fac_str_totals.push(local_tot);
                            war_candidates.push(k);
                        }
                        let mean = _.mean(fac_str_totals);
                        let fac_weights = fac_str_totals.map((f_s) => Math.abs(f_s - mean));
                        let rand_val = Utility.random.randInt(0, _.sum(fac_weights));
                        let selected_index = 0;
                        let selected_total = 0;
                        for (let i = 0; i < war_candidates.length; i++) {
                            let weight = fac_weights[i];
                            if (weight + selected_total > rand_val) {
                                selected_index = i;
                                break;
                            }
                            selected_total += weight;
                        }

                        let war_decision = war_candidates[selected_index];
                        if (war_decision && !this.isAtWar(kingdom, war_decision) && kingdom !== war_decision) {
                            this.declareWar(kingdom, war_decision, "enemy strength");
                        }

                    }
                    else { //start a war with a faction based on proximity
                        for (let i = 0; i < 10; i++) {
                            let rand_settlement_seed = Utility.random.randItem(kingdom.getOwnedSettlements());
                            let choice = rand_settlement_seed.findRandom("external", kingdom);
                            if (choice && !this.isAtWar(kingdom, choice!.getKingdom()!)) {
                                this.declareWar(kingdom, choice!.getKingdom()!, "border friction");
                                break;
                            }
                        }
                    }
                }
            }
        }

        this.total_steps++;
    }
}