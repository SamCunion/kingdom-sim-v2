import Kingdom from "./Kingdom";
import {Utility} from "./lib/SRL";
import Settlement from "./Settlement";

export default class GraphGenerator {

    constructor(kingdoms: Kingdom[]) {
        
    }

    public Generate(): Graph {

        //generate capitals
        
    }


}

export type Graph = {
    nodes: Settlement[],
    connections: Settlement[][];
}