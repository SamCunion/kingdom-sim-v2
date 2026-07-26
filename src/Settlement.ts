/**
 * Settlement class defines default behaviour for different settlement types
 */

import { Connection } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import {Component, Scene, SolidRenderer, TextComponent, Utility, Vector2} from "./lib/SRL";
import { EngineInfo } from "./lib/SRL/Engine";
import Lord from "./Lord";

export default abstract class Settlement extends Component {

    private kingdom: Kingdom|null = null;
    public name: string;
    private scene: Scene;
    private info_shown: boolean = false;
    private connections: Connection[] = [];
    public garrison: number = 0;
    public garrison_lords: Lord[] = []; //garrison lords are INSIDE the settlement, defending/resting. Must be lords of the same kingdom as the settlement.
    public field_lords: Lord[] = []; //field lords are OUTSIDE the settlement, can be lords of other kingdoms.
    public besieged: boolean = false;

    //transition particle
    private readonly TRANSITION_STEPS = 10; //number of frames the particle takes to travel from start to destination
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
    }


    override Update(info?: EngineInfo): void {
        if (this.isPointInComponent(info!.engine.getMousePoint(), info!.engine.getCameraPos()) && !this.info_shown) {

            //clear previous inspector
            $("#garrison-list-container").empty();
            $("#field-list-container").empty();

            //populate inspector

            $("#inspector-settlement-name").html(this.name);
            if (this.getKingdom()) {
                $("#inspector-settlement-name").css("color", this.getKingdom()!.colour);
            }
            else {
                $("#inspector-settlement-name").css("color", "black");
            }

            //catalogue inhabitants by kingdom, for the garrison and field lords.

            let field_lords: any = {};
            for (let lord of this.field_lords) {
                if (!field_lords[lord.getKingdom().name]) {
                    field_lords[lord.getKingdom().name] = [];
                }
                field_lords[lord.getKingdom().name].push(lord);
            }

            //build the lists
            if (this.node_id !== "battlefield") {
                let container = $(`<div class="p-4" style="overflow-y: scroll"></div>`);
                let colour = this.getKingdom()!.colour;
                let list = $(`<ul></ul>`);
                list.append(`<li style="color:${colour}">${this.garrison} - Garrison</li>`);
                let kingdom_total = 0;
                for (let lord of this.garrison_lords) {
                    list.append(`<li style="color:${colour}">${lord.warband_size} - ${lord.name}</li>`);
                    kingdom_total += lord.warband_size;
                }
                let title = $(`<h3 style="color:${colour}">${this.getKingdom()!.name}: ${kingdom_total}</h3>`);
                container.append(title);
                container.append(list);
                $("#garrison-list-container").append(container);
            }

            for (let k_name of Object.keys(field_lords)) {
                let container = $(`<div class="p-4"></div>`)
                let lords: Lord[] = field_lords[k_name];
                let colour = lords[0].getKingdom().colour;
                let list = $(`<ul></ul>`);

                let kingdom_total = 0;
                for (let lord of lords) {
                    list.append(`<li style="color:${colour}">${lord.warband_size} - ${lord.name}</li>`);
                    kingdom_total += lord.warband_size;
                }

                let title = $(`<h3 style="color:${colour}">${k_name}: ${kingdom_total}</h3>`);
                container.append(title);
                container.append(list);
                $("#field-list-container").append(container);
            }

            this.info_shown = true;
            setTimeout(() => { //refresh after 1s
                this.info_shown = false;
            }, 1000)
        }
        else if (!this.isPointInComponent(info!.engine.getMousePoint(), info!.engine.getCameraPos()) && this.info_shown) {
            this.info_shown = false;
            $("#inspector-settlement-name").html("");
            $("#garrison-list-container").empty();
            $("#field-list-container").empty();
        }
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
        for (let t of this.transitions) {
            let loc = Utility.math.lerp(t.start, t.destination, t.step / this.TRANSITION_STEPS);
            ctx.fillStyle = t.colour;
            ctx.fillRect(loc.x - 5, loc.y - 5, 10, 10);

            t.step++;
            //this transition animation has completed, remove it
            if (t.step == this.TRANSITION_STEPS) {
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