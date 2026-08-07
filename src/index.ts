/**
 * Entrypoint for app
 */

import Castle from "./Castle";
import City from "./City";
import GraphGenerator from "./GraphGenerator";
import Inspector from "./Inspector";
import Kingdom from "./Kingdom";
import {Engine, Scene, Utility} from "./lib/TSRL";
import Lord, { LordBehaviour } from "./Lord";
import Settlement from "./Settlement";
import WarHandler from "./WarHandler";

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
        const WINDOW_W = window.innerWidth * 0.6;//1200;
        //height of the display
        const WINDOW_H = window.innerHeight;//900;
        //graph generator seed
        const GRAPH_SEED = Math.random();
        //==================================

        let engine = new Engine(document.querySelector("#app-container")!);

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
                let castle = new Castle(scene, name + " Castle");
                kingdom.addSettlement(castle);
            }
        }

        //create lords
        const LORDS_PER_KINGDOM = 10;
        for (let k of kingdoms) {
            let settlements = k.getOwnedSettlements();
            for (let i = 0; i < LORDS_PER_KINGDOM; i++) {
                let lord;
                if (i == 0) {
                    //create king
                    let name = this.getNewLordName();
                    lord = new Lord(name, k, true);
                }
                else {
                    //create lord
                    let name = this.getNewLordName();
                    lord = new Lord(name, k, false);
                }

                //set the lords "home" and move them there
                if (i < settlements.length) {
                    lord.moveTo(settlements[i]);
                    lord.enterSettlement();
                }
                else {
                    lord.moveTo(k.capital);
                    lord.enterSettlement();
                }
            }
        }
        console.log("Created lords: ", Lord.getLords());

        //create map graph
        const graph_generator = new GraphGenerator(kingdoms, WINDOW_W, WINDOW_H);
        let graph_create_success = graph_generator.Generate(GRAPH_SEED, scene);

        if (!graph_create_success) {
            alert("The map generator has detected that some nodes are unreachable. Try generating a new map or this could have some interesting effects on the simulation!");
        }

        const WAR_HANDLER = new WarHandler(kingdoms);

        scene.show();
        engine.Run();

        //start the "game loop"
        Inspector.Init(kingdoms, () => {
            //lord actions
            const lords = Lord.getLords();
            for (let i = 0; i < lords.length; i++) {
                lords[i].Act();
            }

            //battle calculations
            //for every location, for every war, determine if lords exist in a war. If so, do a battle calculation for that war.
            for (let s of Settlement.getSettlements()) {
                let active_kingdoms: Kingdom[] = [];
                for (let l of s.field_lords) {
                    if (!active_kingdoms.includes(l.getKingdom())) {
                        active_kingdoms.push(l.getKingdom());
                    }
                }
                for (let w of WAR_HANDLER.getWars()) {
                    if (active_kingdoms.includes(w.kingdoms[0]) && active_kingdoms.includes(w.kingdoms[1])) {
                        //both are here, initiate a battle and calculate fatalities for this step
                        let side_a_lords = [];
                        let side_a_sum = 0;
                        let side_b_lords = [];
                        let side_b_sum = 0;
                        for (let l of s.field_lords) {
                            if (l.getKingdom() == w.kingdoms[0]) {
                                side_a_lords.push(l);
                                side_a_sum += l.warband_size;
                            }
                            else if (l.getKingdom() == w.kingdoms[1]) {
                                side_b_lords.push(l);
                                side_b_sum += l.warband_size;
                            }
                        }

                        //calculate fatalities
                        let percentage_of_total_killed = Utility.random.randInt(10, 15, true);
                        let n_killed_total = Math.ceil((percentage_of_total_killed / 100) * (side_a_sum + side_b_sum));

                        //for each fatality
                        for (let i = 0; i < n_killed_total; i++) {
                            //determine which side the fatality should be on
                            let randval = Utility.random.randInt(0, side_a_sum + side_b_sum, true);
                            if (randval > side_a_sum) {
                                //fatality on side A (inversed)
                                let randval = Utility.random.randInt(0, side_a_sum, true);
                                let sum = 0;
                                for (let a_l of side_a_lords) {
                                    sum += a_l.warband_size;
                                    if (sum >= randval) {
                                        a_l.warband_size--;
                                        side_a_sum--;
                                        break;
                                    }
                                }
                            }
                            else {
                                //fatality on side B (inversed)
                                let randval = Utility.random.randInt(0, side_b_sum, true);
                                let sum = 0;
                                for (let b_l of side_b_lords) {
                                    sum += b_l.warband_size;
                                    if (sum >= randval) {
                                        b_l.warband_size--;
                                        side_b_sum--;
                                        break;
                                    }
                                }
                            }
                        }

                        //check for dead lords, deadify them
                        for (let l of side_a_lords.concat(side_b_lords)) {
                            if (l.warband_size <= 0 && l.behaviour_state !== LordBehaviour.IMPRISONED) {
                                l.warband_size = 0;
                                if (Math.random() < 0.5) { //escape
                                    let destination = Utility.random.randItem(l.getKingdom().getOwnedSettlements());
                                    if (destination !== l.location) {
                                        l.moveTo(destination);
                                    }
                                    l.enterSettlement();
                                    if (l.is_king) {
                                        Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} was defeated in battle but managed to escape!`);
                                    }
                                    console.log(`${l.name} has been defeated in battle but managed to escape.`);
                                }
                                else { //gulag
                                    l.imprison_duration = 50;
                                    l.behaviour_state = LordBehaviour.IMPRISONED;
                                    if (side_a_lords[0].getKingdom() == l.getKingdom()) {
                                        l.imprisoned_by = side_b_lords[0].getKingdom();
                                    }
                                    else {
                                        l.imprisoned_by = side_a_lords[0].getKingdom();
                                    }
                                    if (l.is_king) {
                                        Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} has been taken prisoner by ${l.imprisoned_by.name}!`);
                                    }
                                    console.log(`${l.name} has been taken prisoner`);
                                }
                            }
                        }
                    }
                }
            }

            //siege calculations

            //update wars
            WAR_HANDLER.Step();
        })
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