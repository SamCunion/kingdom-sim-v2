/**
 * Entrypoint for app
 */

import Castle from "./Castle";
import City from "./City";
import GraphGenerator, { Graph } from "./GraphGenerator";
import Kingdom from "./Kingdom";
import {Engine, Scene, Utility} from "./lib/SRL";

let KINGDOM_NAMES = ["Nords", "Swadia", "Rhodoks", "Kergit", "Vaegirs", "Sarranid", "Aserai", "Battania", "Khuzait", "Sturgia", "Vlandia"];

let SETTLEMENT_NAMES = [
    "Alderford", "Brackenwall", "Crestholm", "Dunmere", "Eldenwatch", "Fallowridge", "Glenmarch", "Hartwell", "Ironstead", "Kingsbarrow",
    "Larkhollow", "Marrowfield", "Oakenshire", "Redwyn", "Stonebrook", "Thornwick", "Westerholt", "Windmere", "Yarrowbridge", "Highwarden",
    "Bjornvik", "Drakkensund", "Frosthalla", "Gunnarstad", "Hjalmfjord", "Isenfell", "Jorvikholm", "Kaldsund", "Norrhalla", "Skjoldheim",
    "Stormvik", "Thrymfell", "Ulfsfjord", "Vargstad", "Wintermark", "Yngarstead", "Rimehaven", "Hrafnborg", "Skarholm", "Fjellgard",
    "Arenograd", "Belgorin", "Chernovar", "Darskova", "Elyagrad", "Frostov", "Gorinsk", "Karshevik", "Lodovik", "Morozhyn",
    "Novarusk", "Ostvelka", "Pereskyn", "Ravnygrad", "Svetlovo", "Tarnovik", "Velgorod", "Veshtova", "Zimnyholm", "Krestov",
    "Barrowcliff", "Cragspire", "Dellharth", "Fennrock", "Greenhollow", "Highspire", "Keldbarrow", "Mossreach", "Pinewatch", "Ridgefall",
    "Rockhaven", "Shardpeak", "Southmere", "Stonehollow", "Tarnspire", "Undercrest", "Valemont", "Wyrmcliff", "Hillwarden", "Briarhold",
    "Aksun", "Batu Khar", "Chagan Ordu", "Dalgatai", "Erden Tal", "Gurkhun", "Kharzun", "Muratai", "Narak Pass", "Ordoshar",
    "Qazhen", "Sarnak", "Tolgatai", "Uldan Steppe", "Varkhun", "Yurtai", "Zalghar", "Keshun Ordu", "Tamarak", "Ulzar"
];

let LORD_NAMES = [
    "Alaric", "Berengar", "Cedric", "Dalmor", "Edric", "Fendrel", "Garran", "Halden", "Isenbard", "Jorlan",
    "Kaelric", "Lothar", "Marnic", "Norvald", "Osric", "Perrin", "Quinvar", "Roderin", "Selwick", "Tarmund",
    "Bjornulf", "Dagfinn", "Eirikson", "Frode", "Gunnvald", "Hrolf", "Ingmar", "Jorund", "Ketil", "Leifvar",
    "Mjorn", "Orvar", "Ragnvald", "Sigmar", "Torsten", "Ulfrik", "Vargir", "Yngrim", "Skarde", "Thrain",
    "Antonin", "Borislav", "Chernov", "Davorin", "Eldarov", "Fyodorin", "Gavril", "Ilyanov", "Kazimir", "Leonid",
    "Mirovan", "Olegar", "Petrovic", "Radovan", "Sergein", "Tovar", "Vasilin", "Yaroslav", "Zorin", "Kresimir",
    "Ardan", "Belric", "Corvan", "Durnwald", "Elthor", "Fenric", "Galdemar", "Harvold", "Jastin", "Keldran",
    "Lorwick", "Marvold", "Nerrin", "Orwyn", "Pellard", "Rannic", "Stenwald", "Torwick", "Ulmar", "Werrin",
    "Aksai", "Batujin", "Chagan", "Dalgor", "Erketai", "Gansukh", "Harkun", "Jirgal", "Kharun", "Murtai",
    "Nergui", "Orlok", "Qadan", "Sargul", "Torgai", "Uldar", "Varkhun", "Yusai", "Zolgar", "Temur"
];

class Main {

    public static Main(): void {
        console.log("Hello, World!");


        //=============SETTINGS=============
        //define number of kingdoms
        const no_kingdoms = 6;
        //number of sub-cities (non capitals, still cities) each kingdom could have
        const no_subcities = [2]; //[2, 3];
        //number of castles each kingdom could have
        const no_castles = [3]; //[3, 4];
        //width of the display
        const WINDOW_W = 1200;
        //height of the display
        const WINDOW_H = 800;
        //graph generator seed
        const GRAPH_SEED = Math.random();
        //==================================

        let engine = new Engine(document.querySelector("main")!);

        engine.Init({
            height: WINDOW_H,
            width: WINDOW_W,
            FPSCap: 60,
            background: "#eaeaea"
        })

        const scene = new Scene(engine);

        //create kingdoms
        let kingdoms = [];
        for (let i = 0; i < no_kingdoms; i++) {
            let name;
            let colour;

            //get random kingdom name
            name = Utility.random.randItem(KINGDOM_NAMES);
            Utility.array.removeItem(KINGDOM_NAMES, name);

            //get random kingdom colour
            let r = Utility.random.randInt(0, 255);
            let g = Utility.random.randInt(0, 255);
            let b = Utility.random.randInt(0, 255);
            colour = `rgb(${r}, ${g}, ${b})`;
            
            const kingdom = new Kingdom(name, colour);
            kingdoms.push(kingdom);
            console.log(`Created new kingdom "${name}"`, kingdom);
        }

        //create settlements
        for (let kingdom of kingdoms) {
            //each kingdom needs a capital
            let name = this.getNewSettlementName();
            let capital = new City(scene, name, true);
            kingdom.addSettlement(capital);


            //each kingdom needs some sub cities
            for (let i = 0; i < Utility.random.randItem(no_subcities); i++) {
                let name = this.getNewSettlementName();
                let city = new City(scene, name);
                kingdom.addSettlement(city);
            }

            //each kingdom needs some castles
            for (let i = 0; i < Utility.random.randItem(no_castles); i++) {
                let name = this.getNewSettlementName();
                let castle = new Castle(scene, name);
                kingdom.addSettlement(castle);
            }
        }

        //create lords

        //create map graph
        const graph_generator = new GraphGenerator(kingdoms, WINDOW_W, WINDOW_H);
        const map_graph: Graph = graph_generator.Generate(GRAPH_SEED);

        scene.show();
        engine.Run();
    }

    /**
     * Gets a brand new unused settlement name
     */
    private static getNewSettlementName(): string {
        if (SETTLEMENT_NAMES.length == 0) {
            throw new RangeError("Tried to get a new settlement name when the list was already exhausted.");
        }
        let name = Utility.random.randItem(SETTLEMENT_NAMES);
        Utility.array.removeItem(SETTLEMENT_NAMES, name);
        return name;
    }

    /**
     * Gets a brand new unused lord name
     */
    private static getNewLordName(): string {
        if (LORD_NAMES.length == 0) {
            throw new RangeError("Tried to get a new lord name when the list was already exhausted.");
        }
        let name = Utility.random.randItem(LORD_NAMES);
        Utility.array.removeItem(LORD_NAMES, name);
        return name;
    }
}

//entry
Main.Main();