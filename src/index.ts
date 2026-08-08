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
        let params = new URLSearchParams(window.location.search);
        //use provided seed, otherwise use random seed.
        const GRAPH_SEED = typeof (params.get("seed")) == "string" ? Number(params.get("seed")) : Math.floor(Math.random() * 100000000);
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
        Inspector.Init(kingdoms, GRAPH_SEED, () => {
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
                    if (!active_kingdoms.includes(l.getKingdom()) && l.behaviour_state !== LordBehaviour.IMPRISONED) {
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
                            if (l.behaviour_state !== LordBehaviour.IMPRISONED && l.getKingdom() == w.kingdoms[0]) {
                                side_a_lords.push(l);
                                side_a_sum += l.warband_size;
                            }
                            else if (l.behaviour_state !== LordBehaviour.IMPRISONED && l.getKingdom() == w.kingdoms[1]) {
                                side_b_lords.push(l);
                                side_b_sum += l.warband_size;
                            }
                        }

                        //calculate fatalities
                        let percentage_of_total_killed = Utility.random.randInt(10, 15, true);
                        let n_killed_total = Math.ceil((percentage_of_total_killed / 100) * (side_a_sum + side_b_sum));

                        //for each fatality
                        for (let i = 0; i < n_killed_total; i++) {
                            //is one side completely depleated?
                            if (side_a_sum == 0 || side_b_sum == 0) {
                                break;
                            }
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
                                        l.moveTo(destination, false);
                                    }
                                    l.enterSettlement();
                                    if (l.is_king) {
                                        Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} was defeated in battle but managed to escape!`);
                                    }
                                    console.log(`${l.name} has been defeated in battle but managed to escape.`);
                                }
                                else { //gulag
                                    l.imprison_duration = Utility.random.randInt(Lord.IMPRISON_DURATION_RANGE[0], Lord.IMPRISON_DURATION_RANGE[1], true);
                                    l.behaviour_state = LordBehaviour.IMPRISONED;
                                    if (!side_a_lords[0] || !side_b_lords[0]) {
                                        console.log(side_a_lords, side_b_lords);
                                    }
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
            for (let s of Settlement.getSettlements()) {
                if (s.besieged) {
                    //check if there are still enemy lords in the field
                    let siege_valid = false;
                    let war_kingdoms = s.getKingdom()!.getKingdomsAtWar();
                    for (let l of s.field_lords) {
                        if (war_kingdoms.includes(l.getKingdom())) {
                            siege_valid = true;
                            break;
                        }
                    }
                    if (siege_valid) {
                        if (s.besieged_duration > s.siege_duration) {
                            /**
                             * take all lords in field that are of enemy type, sum their power
                             * take all lords in garrison + garrison, sum their power then multiply by 1.25.
                             * each "assault" should kill between 50-100 troops.
                             * if garrison reaches 0, transition settlement to a random attacking kingdom that was part of the attack + replenish garison
                             * if sieging kingdoms reaches 0, replenish garrison by 50-100, up to a maximum. End the siege.
                             * if that was a kingdoms last settlement, call kingdom.defeat() to clean up the kingdom.
                             */

                            //do a siege calculation
                            let assault_fatalities = Utility.random.randInt(50, 100);
                            let attacker_sum = 0;
                            let defender_sum = s.garrison;
                            let attacker_power = 0;
                            let defender_power = s.garrison;
                            let attacker_lords = [];
                            let defender_lords = [];
                            let settlement_kingdom = s.getKingdom()!;
                            for (let l of s.field_lords) {
                                if (l.behaviour_state == LordBehaviour.SIEGE) {
                                    attacker_power += l.warband_size;
                                    attacker_sum += l.warband_size;
                                    attacker_lords.push(l);
                                }
                            }
                            for (let l of s.garrison_lords) {
                                defender_power += l.warband_size;
                                defender_sum += l.warband_size;
                                defender_lords.push(l);
                            }
                            defender_power *= s.siege_defender_power_multiplier;

                            //for each fatality
                            for (let i = 0; i < assault_fatalities; i++) {
                                //is one side completely depleated?
                                if (attacker_sum == 0 || defender_sum == 0) {
                                    break;
                                }
                                //determine which side the fatality should be on
                                let randval = Utility.random.randInt(0, attacker_power + defender_power, true);
                                if (randval > attacker_power) {
                                    //fatality on attackers
                                    let randval = Utility.random.randInt(0, attacker_sum, true);
                                    let sum = 0;
                                    for (let a_l of attacker_lords) {
                                        sum += a_l.warband_size;
                                        if (sum >= randval) {
                                            a_l.warband_size--;
                                            attacker_sum--;
                                            attacker_power--;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    //fatality on defenders
                                    let randval = Utility.random.randInt(0, defender_sum, true);
                                    let sum = 0;
                                    let garrison_fatality = true;
                                    for (let b_l of defender_lords) {
                                        sum += b_l.warband_size;
                                        if (sum >= randval) {
                                            b_l.warband_size--;
                                            defender_sum--;
                                            garrison_fatality = false;
                                            break;
                                        }
                                    }
                                    if (garrison_fatality) {
                                        s.garrison--;
                                        defender_sum--;
                                    }
                                }
                            }

                            //check siege end conditions
                            if (defender_sum == 0) {
                                //siege was successful
                                Inspector.logNewMessage(`${attacker_lords[0].getKingdom().name} have taken ${s.name} from ${s.getKingdom()!.name}!`);
                                s.besieged_duration = 0;
                                s.besieged = false;

                                //imprison defending lords
                                for (let l of defender_lords) {
                                    l.imprison_duration = Utility.random.randInt(Lord.IMPRISON_DURATION_RANGE[0], Lord.IMPRISON_DURATION_RANGE[1], true);
                                    l.behaviour_state = LordBehaviour.IMPRISONED;
                                    l.imprisoned_by = attacker_lords[0].getKingdom();
                                    if (l.is_king) {
                                        Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} has been taken prisoner by ${l.imprisoned_by.name}!`);
                                    }
                                    console.log(`${l.name} has been taken prisoner`);
                                }

                                //transfer settlement owner and restore garrison
                                s.getKingdom()!.removeSettlement(s);
                                attacker_lords[0].getKingdom().addSettlement(s);
                                s.resetGarrison();
                                //reset siege target for kingdoms with this settlement as their target
                                for (let k of kingdoms) {
                                    if (k.current_target == s) {
                                        k.current_target = null;
                                    }
                                }

                                //break attackers locked siege state
                                for (let l of attacker_lords) {
                                    l.behaviour_state = 0; //recover
                                }

                                if (settlement_kingdom.getOwnedSettlements().length == 0) { //settlement taken was the last of the kingdom. RIP kingdom.
                                    Inspector.logNewMessage(`${settlement_kingdom.name} have been completely defeated!`);
                                    settlement_kingdom.defeated = true;

                                    //make peace in their wars
                                    for (let w of [...settlement_kingdom!.wars]) {
                                        WAR_HANDLER.makePeace(w);
                                    }

                                    //re-assign lords
                                    for (let l of [...settlement_kingdom.lords]) {
                                        if (l.is_king) {
                                            //is the king
                                            l.behaviour_state = 5;
                                            l.imprison_duration = Infinity;
                                            l.exitSettlement();
                                            continue;
                                        }
                                        else {
                                            while (true) {
                                                let rand_kingdom = Utility.random.randItem(kingdoms);
                                                if (rand_kingdom.defeated) {
                                                    continue;
                                                }
                                                else {
                                                    Utility.array.removeItem(l.getKingdom().lords, l);
                                                    l.setKingdom(rand_kingdom);
                                                    console.log(`assigned to ${l.getKingdom().name}`)
                                                    //move them to a friendly place
                                                    if (!l.in_field) {
                                                        l.exitSettlement();
                                                    }
                                                    let rand_safe_place = Utility.random.randItem(l.getKingdom()!.getOwnedSettlements());
                                                    if (rand_safe_place !== l.location) {
                                                        l.moveTo(rand_safe_place, false);
                                                    }
                                                    l.enterSettlement();
                                                    break;
                                                }
                                            }
                                        }
                                    }

                                    //check if theres only one kingdom left
                                    let kingdoms_left = 0;
                                    for (let k of kingdoms) {
                                        if (!k.defeated) {
                                            kingdoms_left++;
                                        }
                                    }
                                    if (kingdoms_left == 1) {
                                        //we have a winner!
                                        let winner = Settlement.getSettlements()[0].getKingdom()!;
                                        Inspector.logNewMessage(`${winner.name} has defeated all other kingdoms! All hail ${winner.lords[0].name}!`);
                                    }
                                }
                            }
                            else if (attacker_sum == 0) {
                                //siege was unsuccessful
                                Inspector.logNewMessage(`${s.getKingdom()!.name} broke the siege of ${s.name}!`);
                                s.besieged_duration = 0;
                                s.besieged = false;

                                //replenish some of the garrison
                                s.resetGarrison();

                                //escape or imprison attacking lords
                                for (let l of attacker_lords) {
                                    if (Math.random() < 0.5) { //escape
                                        let destination = Utility.random.randItem(l.getKingdom().getOwnedSettlements());
                                        if (destination !== l.location) {
                                            l.moveTo(destination, false);
                                        }
                                        l.enterSettlement();
                                        if (l.is_king) {
                                            Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} was defeated in battle but managed to escape!`);
                                        }
                                        console.log(`${l.name} has been defeated in battle but managed to escape.`);
                                    }
                                    else { //gulag
                                        l.imprison_duration = Utility.random.randInt(Lord.IMPRISON_DURATION_RANGE[0], Lord.IMPRISON_DURATION_RANGE[1], true);
                                        l.behaviour_state = LordBehaviour.IMPRISONED;
                                        l.imprisoned_by = s.getKingdom()!;
                                        if (l.is_king) {
                                            Inspector.logNewMessage(`${l.name} of ${l.getKingdom().name} has been taken prisoner by ${l.imprisoned_by.name}!`);
                                        }
                                        console.log(`${l.name} has been taken prisoner`);
                                    }
                                }
                            }
                        }
                        s.besieged_duration++;
                    }
                    else {
                        s.besieged = false;
                        s.besieged_duration = 0;
                    }
                }
            }

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