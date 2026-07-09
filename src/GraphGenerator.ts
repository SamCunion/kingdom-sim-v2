import Castle from "./Castle";
import City from "./City";
import Kingdom from "./Kingdom";
import {Utility, Vector2} from "./lib/SRL";
import Settlement from "./Settlement";

export default class GraphGenerator {

    private kingdoms: Kingdom[];
    private area: Vector2;

    constructor(kingdoms: Kingdom[], pxWidth: number, pxHeight: number) {
        this.kingdoms = kingdoms;
        this.area = new Vector2(pxWidth, pxHeight);
    }

    public Generate(seed: number): Graph {

        //new instance of a seeded random number generator to ensure repeatable graphs
        const random = new Utility.random.SeededRandomNG(String(seed));

        console.log(`Beginning map generation with seed ${String(seed)}`)

        const all_settlements = Settlement.getSettlements();

        //get starting locations for each kingdom
        let start_locations = [];
        for (let i = 0; i < this.kingdoms.length; i++) {
            let recursions = 0;
            while (true) {
                //get new location candidate
                random.clampBetween(0, this.area.x - 25);
                let x = Math.floor(random.Next());
                random.clampBetween(0, this.area.y - 25);
                let y = Math.floor(random.Next());
                let new_location = new Vector2(x, y);

                //the first kingdom starting location is always valid
                if (start_locations.length == 0) {
                    start_locations.push(new_location);
                    break;
                }

                //test if its too close to any other start locations
                let valid = true;
                for (let j = 0; j < start_locations.length; j++) {
                    if (Math.abs(start_locations[j].x - new_location.x) < 200 && Math.abs(start_locations[j].y - new_location.y) < 200) {
                        //too close to an existing start location
                        valid = false;
                        break;
                    }
                }

                if (valid) {
                    start_locations.push(new_location);
                    break;
                }

                recursions++;

                if (recursions > 100) {
                    throw new Error("Unable to find a valid starting location after 100 attempts, there may be no valid starting locations left.");
                }
            }
        }
        
        //valid start locations found
        console.log("Found valid kingdom start locations");

        //set the location of each kingdoms capital to the start location
        for (let i = 0; i < this.kingdoms.length; i++) {
            this.kingdoms[i].getCapital().setLocation(start_locations[i]);
        }

        //each kingdom needs to place their sub cities in the voronoi cell of the kingdom with respect to the capital
        for (let kingdom of this.kingdoms) {
            for (let settlement of kingdom.getOwnedSettlements()) {
                if (settlement instanceof City && !settlement.isCapital) {
                    //is a subcity
                    while (true) {
                        //get a new random location on the map
                        random.clampBetween(0, this.area.x);
                        let test_x = Math.floor(random.Next());
                        random.clampBetween(0, this.area.y);
                        let test_y = Math.floor(random.Next());
                        let test_location = new Vector2(test_x, test_y);

                        //set the settlements location to the random location
                        settlement.setLocation(test_location);
                        
                        //check that the placement is valid
                        if (this.checkValidPlacement(settlement)) {
                            break;
                        }
                    }
                }
            }
        }
        
        //each kingdom needs a set of castles
        for (let kingdom of this.kingdoms) {
            for (let settlement of kingdom.getOwnedSettlements()) {
                if (settlement instanceof Castle) {
                    //is a castle
                    while (true) {
                        //get a new random location on the map
                        random.clampBetween(0, this.area.x);
                        let test_x = Math.floor(random.Next());
                        random.clampBetween(0, this.area.y);
                        let test_y = Math.floor(random.Next());
                        let test_location = new Vector2(test_x, test_y);

                        //set the settlements location to the random location
                        settlement.setLocation(test_location);

                        //check that the placement is valid
                        if (this.checkValidPlacement(settlement)) {
                            break;
                        }
                    }
                }
            }
        }

        return {
            nodes: [],
            connections: []
        }
    }


    /**
     * Returns the kingdom who's capital is closest to the given point
     * @param point a point on the map plane
     * @returns the kingdom whose capital is closest to the given point
     */
    private getKingdomOfPoint(point: Vector2): Kingdom {
        let closest_kingdom;
        let closest_distance = Infinity;

        //for each kingdom
        for (let i = 0; i < this.kingdoms.length; i++) {
            //compute the distance as the crow flies from the point to the kingdoms capital
            let trial_kingdom = this.kingdoms[i];
            let dx = trial_kingdom.getCapital().getLocation().x - point.x;
            let dy = trial_kingdom.getCapital().getLocation().y - point.y;
            let mag = dx * dx + dy * dy;

            //if the distance is closer than the previous closest, update
            if (mag < closest_distance) {
                closest_kingdom = trial_kingdom;
                closest_distance = mag;
            }
        }

        //return the kingdom closest to the point
        return closest_kingdom!;
    }

    /**
     * Checks the settlements current location is valid given a set of rules.
     * @param settlement a settlement
     * @returns true if the settlements current location is valid, else false
     */
    private checkValidPlacement(settlement: Settlement): boolean {
        //check if location is within voronoi cell of the kingdom, if not its invalid
        if (this.getKingdomOfPoint(settlement.getLocation()) !== settlement.getKingdom()) {
            return false;
        }

        //check that the placement is within the bounds of the map
        if (settlement.getLocation().x < 0 || settlement.getLocation().x + 20 > this.area.x || settlement.getLocation().y < 0 || settlement.getLocation().y + 20 > this.area.y) {
            return false;
        }

        //finally, check if its new location causes it to collide with another settlement, if so, its invalid
        let col = false;
        for (let s of Settlement.getSettlements()) {
            if (s !== settlement && settlement.collision(s).length > 0) {
                col = true;
                break;
            }
        }
        if (col) {
            return false;
        }

        //location passes all tests
        return true;
    }
}

export type Graph = {
    nodes: Settlement[],
    connections: Connection[];
}

export type Connection = {
    settlement1: Settlement,
    settlement2: Settlement,
    weight: number
}