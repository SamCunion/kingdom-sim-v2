/**
 * Settlement class defines default behaviour for different settlement types
 */

import { Connection } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import {Component, Scene, SolidRenderer, TextComponent, Utility, Vector2} from "./lib/SRL";
import { EngineInfo } from "./lib/SRL/Engine";

export default abstract class Settlement extends Component {

    private kingdom: Kingdom|null = null;
    private name: string;
    private scene: Scene;
    private connections: Connection[] = [];
    private nametag: TextComponent|null = null;

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
        this.Renderer = new SolidRenderer(kingdom.getColour());
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
        if (this.isPointInComponent(info!.engine.getMousePoint(), info!.engine.getCameraPos()) && this.nametag == null) {
            //create nametag
            this.nametag = new TextComponent(this.scene);
            this.nametag.setText(this.name);
            this.nametag.setLocation(new Vector2(this.getLocation().x, this.getLocation().y + 25));
        }
        else if (this.nametag !== null && !this.isPointInComponent(info!.engine.getMousePoint(), info!.engine.getCameraPos())) {
            //remove nametag
            this.nametag.disable();
            this.nametag = null;
        }
    }

    override LateUpdate(info?: EngineInfo): void {
        const ctx = info!.engine.getRenderingContext()!;
        //draw the settlements connections
        for (let c of this.connections) {
            let colour = "black";
            if (c.settlement1.node_id != "battlefield" && c.settlement2.node_id !== "battlefield" && (c.settlement1.getKingdom() == c.settlement2.getKingdom())) {
                colour = c.settlement1.getKingdom()!.getColour();
            }

            //draw
            ctx.beginPath();
            ctx.moveTo(c.settlement1.getCentrePoint().x, c.settlement1.getCentrePoint().y);
            ctx.lineTo(c.settlement2.getCentrePoint().x, c.settlement2.getCentrePoint().y);
            ctx.lineWidth = 1;
            ctx.strokeStyle = colour;
            ctx.stroke();
        }
    }


}