/**
 * Settlement class defines default behaviour for different settlement types
 */

import _ from "lodash";
import { Connection } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import {Component, Scene, SolidRenderer, Utility, Vector2} from "./lib/TSRL";
import { EngineInfo } from "./lib/TSRL/Engine";
import Lord, { LordBehaviour } from "./Lord";
import Inspector from "./Inspector";

export default abstract class Settlement extends Component {

    private kingdom: Kingdom|null = null;
    public name: string;
    private scene: Scene;
    private connections: Connection[] = [];
    public garrison: number = 0;
    public garrison_lords: Lord[] = []; //garrison lords are INSIDE the settlement, defending/resting. Must be lords of the same kingdom as the settlement.
    public field_lords: Lord[] = []; //field lords are OUTSIDE the settlement, can be lords of other kingdoms.
    public besieged: boolean = false;
    private routing_table = new Map<Settlement, Settlement[]>;

    //transition particle
    private transitions: TransitionData[] = [];

    public abstract node_id: string;

    private static settlements: Settlement[] = [];

    constructor(scene: Scene, name: string) {
        super(scene);
        this.name = name;
        this.scene = scene;

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
        this.Renderer = new SolidRenderer(kingdom.colour);
        this.kingdom = kingdom;
        return true;
    }

    /**
     * Gets the Connection object if there is a connection between this Settlement and the given Settlement, else null
     * @param settlement the settlement to check if there is a connection with
     * @returns the Connection if one exists, else false
     */
    public getConnection(settlement: Settlement): Connection|null {
        for (let connection of this.connections) {
            if (connection.settlement2 == settlement) {
                return connection;
            }
        }
        return null;
    }

    /**
     * Gets all connections for the node
     * @returns the connections of the node
     */
    public getConnections(): Connection[] {
        return this.connections;
    }

    /**
     * Forms a connection between this settlement and another settlement
     * @param settlement the settlement to form a connection with
     * @returns true if the operation was successful, else false
     */
    public addConnection(settlement: Settlement): boolean {
        if (this.getConnection(settlement)) {
            console.error("Error, tried to create a connection between two settlements where a connection already exists", this, settlement);
            return false;
        }
        if (this == settlement) {
            console.error("Error, settlement tried to create a connection with itself", this);
            return false;
        }
        const dist = this.distanceTo(settlement);
        this.connections.push({settlement1: this, settlement2: settlement, weight: dist});
        settlement.connections.push({settlement1: settlement, settlement2: this, weight: dist});
        return true;
    }
    
    /**
     * Removes a connection between this settlement, and the given settlement
     * @param settlement the settlement to remove the connection with
     * @returns true if the operation was successful, else false
     */
    public removeConnection(settlement: Settlement): boolean {
        let connection = this.getConnection(settlement);
        let remote_connection = settlement.getConnection(this);
        if (!connection || !remote_connection) {
            console.error("Error, unable to remove a connection between settlements when a connection does not exist", this, settlement);
            return false;
        }
        Utility.array.removeItem(this.connections, connection);
        Utility.array.removeItem(settlement.connections, remote_connection);
        return true;
    }

    /**
     * Measures the distance between this settlement and another given settlement
     * @param settlement the settlement to measure the distance to
     * @returns the distance between the two settlements
     */
    public distanceTo(settlement: Settlement): number {
        let dx = this.getCentrePoint().x - settlement.getCentrePoint().x;
        let dy = this.getCentrePoint().y - settlement.getCentrePoint().y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Adds a "transition" particle that identifies a lords movement between settlements
     * @param lord the lord making the transition
     * @param destination the settlement the lord is moving to
     */
    public addTransitionParticle(lord: Lord, destination: Settlement): void {
        this.transitions.push({start: this.getCentrePoint(), destination: destination.getCentrePoint(), step: 0, colour: lord.getKingdom().colour});
    }

    ///override method
    public resetGarrison(): void {
        console.error("Error, resetGarrison() called on a settlement that hasn't implemented their method.", this);
    };

    /**
     * Gets the shortest path to the destination from this settlement.
     * @param destination the destination settlement
     * @returns a path of settlements, which should be taken to get to the destination
     */
    public dijkstra(destination: Settlement): Settlement[] {
        //get from memory if already computed
        if (this.routing_table.get(destination)) {
            return this.routing_table.get(destination)!;
        }
        
        //else, its not been computed before, compute it

        let all_nodes = Settlement.getSettlements();
        let dist = new Map();
        let prev = new Map();
        let visited = new Map();

        for (let s of all_nodes) {
            dist.set(s, Infinity);
            prev.set(s, null);
            visited.set(s, false);
        }
        dist.set(this, 0);

        for (let i = 0; i < all_nodes.length; i++) {
            let current = null;
            let bestDist = Infinity;

            for (let s of all_nodes) {
                if (!visited.get(s) && dist.get(s) < bestDist) {
                    bestDist = dist.get(s);
                    current = s;
                }
            }

            if (current === null) {
                break;
            }

            visited.set(current, true);

            for (let c of current.getConnections()) {
                let newDist = dist.get(current) + c.weight;

                if (newDist < dist.get(c.settlement2)) {
                    dist.set(c.settlement2, newDist);
                    prev.set(c.settlement2, current);
                }
            }
        }

        //reconstruct the path
        let path = [];
        let curr = destination;
        while (curr !== null) {
            path.push(curr);
            curr = prev.get(curr);
        }
        path = path.reverse();
        this.routing_table.set(destination, path);

        console.log("dijkstra calculation");

        return path;
    }

    /**
     * Finds the nearest friendly, or enemy settlement according to the given kingdom, form the settlement
     * @param target specify whether it finds the nearest friendly, or enemy settlement
     * @param kingdom the kingdom of interest
     * @returns a settlement that fits the requirement
     */
    public findNearest(target: "friendly" | "enemy", kingdom: Kingdom): Settlement {
        if (target == "friendly") {
            //if their current location is friendly, then its the closest.
            if (this.getKingdom() == kingdom) {
                return this;
            }

            let kingdom_settlements = kingdom.getOwnedSettlements();
            let settlement_paths = [];
            for (let s of kingdom_settlements) {
                settlement_paths.push(this.dijkstra(s));
            }
            let closest = null;
            let closest_length = Infinity;
            for (let i = 0; i < settlement_paths.length; i++) {
                //paths that include other friendly settlements cant be the closest
                if (_.intersection(kingdom_settlements, settlement_paths[i]).length > 1) {
                    continue;
                }
                let dist = 0;
                for (let j = 0; j < settlement_paths[i].length - 1; j++) {
                    let c = settlement_paths[i][j].getConnection(settlement_paths[i][j + 1]);
                    dist += c!.weight;
                }
                if (closest_length > dist) {
                    closest_length = dist;
                    closest = kingdom_settlements[i];
                }
            }
            return closest!;
        }
        else {
            let enemy_kingdoms = [];
            if (target == "enemy") {
                for (let w of kingdom.wars) {
                    for (let i = 0; i < w.kingdoms.length; i++) {
                        if (w.kingdoms[i] !== kingdom) {
                            enemy_kingdoms.push(w.kingdoms[i]);
                        }
                    }
                }
            }

            //get list of all enemy settlements
            let enemy_settlements = [];
            for (let enemy of enemy_kingdoms) {
                for (let s of enemy.getOwnedSettlements()) {
                    enemy_settlements.push(s);
                }
            }

            let settlement_paths = [];
            for (let s of enemy_settlements) {
                settlement_paths.push(this.dijkstra(s));
            }
            let closest = null;
            let closest_length = Infinity;
            for (let i = 0; i < settlement_paths.length; i++) {
                //paths that include other enemy settlements cant be the closest
                if (_.intersection(enemy_settlements, settlement_paths[i]).length > 1) {
                    continue;
                }
                let dist = 0;
                for (let j = 0; j < settlement_paths[i].length - 1; j++) {
                    let c = settlement_paths[i][j].getConnection(settlement_paths[i][j + 1]);
                    dist += c!.weight;
                }
                if (closest_length > dist) {
                    closest_length = dist;
                    closest = enemy_settlements[i];
                }
            }
            return closest!;
        }
    }

    /**
     * Finds a random settlement that is navegable to, without passing through other settlements of the target type.
     * @param target specify whether it finds a close external (other kingdom, not at war) or close enemy (other kingdom, at war) settlement.
     * @param kingdom the kingdom of interest
     * @returns the settlement found, or null if no valid settlements exist
     */
    public findRandom(target: "external" | "enemy", kingdom: Kingdom): Settlement | null {
        let current_loc: Settlement = this;
        let enemy_kingdoms = [];
        if (target == "enemy") {
            for (let w of kingdom.wars) {
                for (let i = 0; i < w.kingdoms.length; i++) {
                    if (w.kingdoms[i] !== kingdom) {
                        enemy_kingdoms.push(w.kingdoms[i]);
                    }
                }
            }
        }
        for (let i = 0; i < 100000; i++) { //maximum 100,000 iterations until it fails
            let choice = Utility.random.randItem(current_loc.getConnections()).settlement2;
            if (target == "external" && choice.getKingdom() !== kingdom) { //valid external settlement found
                if (choice.node_id !== "battlefield") {
                    return choice;
                }
                else {
                    current_loc = choice;
                }
            }
            else if (target == "enemy") { //TODO: valid enemy settlement found
                if (choice.node_id == "battlefield") {
                    current_loc = choice;
                }
                else if (enemy_kingdoms.includes(choice.kingdom!)) {
                    return choice;
                }
                else {
                    current_loc = choice;
                }
            }
            else { //not a valid settlement, continue to next iteration
                current_loc = choice;
            }
        }

        //valid settlement not found within given iterations, consider the condition invalid
        return null;
    }

    /**
     * Checks if there is a lord the given lord considers an advisary in the field.
     * @param l the lord to check
     * @returns true if there exists an adversary to the lord in the field, else false
     */
    public containsAdversary(l: Lord): boolean {
        let wars = l.getKingdom().wars;
        for (let w of wars) {
            for (let other_lord of this.field_lords) {
                if (other_lord !== l && other_lord.getKingdom() !== l.getKingdom() && w.kingdoms.includes(other_lord.getKingdom())) {
                    return true;
                }
            }
        }
        return false;
    }

    //===STATIC METHODS===
    /**
     * Gets the list of all created settlements
     * @returns a list of settlements
     */
    public static getSettlements(): Settlement[] {
        return this.settlements;
    }

    override MouseUp(event: MouseEvent): void {
        console.log(this);
        Inspector.showSettlement(this);
    }

    override LateUpdate(info?: EngineInfo): void {
        const ctx = info!.engine.getRenderingContext()!;
        //draw the settlements connections
        for (let c of this.connections) {
            let colour = "black";
            if (c.settlement1.node_id != "battlefield" && c.settlement2.node_id !== "battlefield" && (c.settlement1.getKingdom() == c.settlement2.getKingdom())) {
                colour = c.settlement1.getKingdom()!.colour;
            }

            //draw
            ctx.beginPath();
            ctx.moveTo(c.settlement1.getCentrePoint().x, c.settlement1.getCentrePoint().y);
            ctx.lineTo(c.settlement2.getCentrePoint().x, c.settlement2.getCentrePoint().y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = colour;
            ctx.stroke();
        }

        //draw transition particles
        let frac = (info!.FPS * (Inspector.step_duration / 1000)); //(fps * (duration / second)) * step
        for (let t of this.transitions) {
            if (t.step / frac > 1) { //step would go beyond destination, stop early
                continue;
            }
            let loc = Utility.math.lerp(t.start, t.destination, t.step / frac);
            ctx.fillStyle = t.colour;
            ctx.fillRect(loc.x - 5, loc.y - 5, 10, 10);

            t.step++;
            //this transition animation has completed, remove it
            if (t.step >= info!.FPS * (Inspector.step_duration / 1000)) {
                Utility.array.removeItem(this.transitions, t);
            }
        }
    }
}

//data structure for lord transition particles
type TransitionData = {
    start: Vector2,
    destination: Vector2,
    step: number,
    colour: string
}