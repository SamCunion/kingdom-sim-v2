/**
 * Inspector static class handles operations for the inspector
 */

import _ from "lodash";
import Kingdom from "./Kingdom";
import Lord from "./Lord";
import Settlement from "./Settlement";

enum SimState {
    PAUSED = 0,
    PLAYING = 1
}

export default class Inspector {

    //BIND ELEMENTS

    //Controls
    private static speed_slider: HTMLInputElement = document.querySelector("#speed-slider")!;
    private static speed_value: HTMLSpanElement = document.querySelector("#speed-value")!;
    private static play_button: HTMLButtonElement = document.querySelector("#play-button")!;
    private static step_button: HTMLButtonElement = document.querySelector("#step-button")!;
    private static seed_display: HTMLAnchorElement = document.querySelector("#seed-display")!;

    //settlement inspector
    private static garrison_container: HTMLDivElement = document.querySelector("#garrison-container")!;
    private static garrison_list: HTMLDivElement = document.querySelector("#garrison-list")!;
    private static inspector_settlement_name: HTMLSpanElement = document.querySelector("#inspector-settlement-name")!;
    private static field_list: HTMLDivElement = document.querySelector("#field-list")!;

    //kingdom inspector
    private static kingdom_list: HTMLUListElement = document.querySelector("#kingdom-list")!;
    private static kingdom_info: HTMLDivElement = document.querySelector("#kingdom-info")!;

    //notifications
    private static notification_list: HTMLUListElement = document.querySelector("#notification-list")!;
    private static event_log_container: HTMLDivElement = document.querySelector("#event-log-container")!;

    public static step_duration: number = 1000;
    public static readonly step_duration_default: number = 1000;

    private static state: SimState = SimState.PAUSED;
    private static seed: number;
    private static current_settlement: Settlement|null = null;
    private static kingdoms: Kingdom[] = [];
    private static current_kingdom: Kingdom|null = null;
    private static notification_history: HTMLLIElement[] = [];
    private static notification_count: number = 0;
    private static readonly notification_max: number = 50;

    public static Init(kingdoms: Kingdom[], seed: number, new_step_callback: CallableFunction): void {
        //reset slider to remove browser memory
        this.speed_slider.value = "1";

        //display seed
        this.seed_display.innerHTML = seed.toString();
        this.seed = seed;

        //bind kingdoms
        this.kingdoms = kingdoms;

        //attach events
        this.seed_display.addEventListener("click", () => {
            navigator.clipboard.writeText(location.origin + location.pathname + "?seed=" + this.seed);
            this.seed_display.innerHTML = "Copied!";
        });
        this.seed_display.addEventListener("mouseleave", () => {
            this.seed_display.innerHTML = this.seed.toString();
        })
        this.speed_slider.addEventListener("input", () => {
            this.onSpeedSliderChange(Number(this.speed_slider.value));
        })
        this.play_button.addEventListener("click", () => {
            this.onPlayButtonClick();
        })
        this.step_button.addEventListener("click", () => {
            this.onStepButtonClick(new_step_callback);
        })

        //load kingdoms
        this.buildKingdomList();

        //start the loop
        function loop() {

            if (Inspector.state == SimState.PLAYING) {
                new_step_callback();
                if (Inspector.current_settlement) {
                    Inspector.showSettlement(Inspector.current_settlement);
                }
                if (Inspector.current_kingdom) {
                    Inspector.showKingdomInfo(Inspector.current_kingdom)
                }
            }

            setTimeout(loop, Inspector.step_duration);
        }
        loop();
    }

    /**
     * Event handler for the speed slider changing
     * @param value the factor to speed the simulation by
     */
    private static onSpeedSliderChange(value: number) {

        //set new step duration
        this.step_duration = this.step_duration_default / value;

        //update label
        this.speed_value.innerHTML = value.toString();
    }

    /**
     * Event handler for the play/pause button
     */
    private static onPlayButtonClick() {

        //change the colour
        $(this.play_button).toggleClass("btn-pause").toggleClass("btn-play");

        switch (this.state) {
            case SimState.PAUSED: {
                $(this.play_button).html("Pause");
                this.step_button.disabled = true;
                this.state = SimState.PLAYING;
                return;
            }

            case SimState.PLAYING: {
                $(this.play_button).html("Play");
                this.step_button.disabled = false;
                this.state = SimState.PAUSED;
                return;
            }
        }
    }

    /**
     * Builds the list of kingdoms shown in the inspector
     */
    private static buildKingdomList() {
        for (let k of this.kingdoms) {
            let elem = $(`<li class="list-group-item" style="color:${k.colour};">${k.name}</li>`);
            $(elem)[0].addEventListener("click", () => {
                this.showKingdomInfo(k);
                $(".list-group-item").removeClass("active");
                $(elem).addClass("active");
            })
            $(this.kingdom_list).append(elem);
        }
    }

    /**
     * Displays information on a kingdom in the inspector.
     * @param kingdom the kingdom whose info should be shown
     */
    private static showKingdomInfo(kingdom: Kingdom) {
        //reset
        this.current_kingdom = kingdom;
        $(this.kingdom_info).empty();
        let container = $(`<ul></ul>`);

        //add fields
        $(`<li>Kingdom name: ${kingdom.name}</li>`).appendTo(container); //kingdom name
        $(`<li>King name: ${kingdom.lords[0].name}</li>`).appendTo(container); //king name
        $(`<li>No. Lords: ${kingdom.lords.length}</li>`).appendTo(container); //lord count
        $(`<li>Current target: ${kingdom.current_target ? kingdom.current_target.name + ` (${kingdom.current_target.getKingdom()!.name})` : "None"}</li>`).appendTo(container); //current target
        $(`<li>Cities: ${kingdom.getCities().length}</li>`).appendTo(container); //city count
        $(`<li>Castles: ${kingdom.getCastles().length}</li>`).appendTo(container); //castle count
        $(`<li>Settlements: ${kingdom.getOwnedSettlements().length}</li>`).appendTo(container); //total settlement count
        $(`<li>Wars: ${kingdom.wars.length} ${kingdom.wars.length > 0 ? "(" + kingdom.getKingdomsAtWar().map(k => k.name + ", ") + ")" : ""}</li>`).appendTo(container); //war info
        let strength = 0;
        for (let c of kingdom.getCities()) {
            strength += 2;
        }
        for (let c of kingdom.getCastles()) {
            strength += 1;
        }
        $(`<li>Kingdom strength: ${strength}</li>`).appendTo(container); //kingdom strength

        //render
        container.appendTo(this.kingdom_info);
    }

    /**
     * Displays a new formatted message to the notification log
     * @param message the message to display
     */
    public static logNewMessage(message: string) {
        //parse the message
        let new_message = message;
        //check for instances of kingdom names
        for (let k of this.kingdoms) {
            if (new_message.indexOf(k.name) > -1) {
                //kingdom name exists in message
                let start_index = new_message.indexOf(k.name);
                let name_length = k.name.length;
                let infill = `<span style="font-weight:bolder;color:${k.colour}">${k.name}</span>`;
                new_message = new_message.slice(0, start_index) + infill + new_message.slice(start_index + name_length);
            }
        }

        //check for instances of settlement names
        let settlements = Settlement.getSettlements();
        for (let s of settlements) {
            if (new_message.indexOf(s.name) > -1) {
                //settlement name exists in message
                let start_index = new_message.indexOf(s.name);
                let name_length = s.name.length;
                let infill = `<span style="font-weight:bolder;color:${s.getKingdom()!.colour}">${s.name}</span>`;
                new_message = new_message.slice(0, start_index) + infill + new_message.slice(start_index + name_length);
            }
        }

        //create the message
        let msg = $(`<li class="notification-message">${new_message}</li>`);
        msg.appendTo(this.notification_list);
        this.notification_history.push(msg[0] as HTMLLIElement);
        this.notification_count++;

        //move notification window to bottom
        Inspector.event_log_container.scrollTo(0, this.event_log_container.scrollHeight);

        //check if there needs to be a message culled
        this.checkNotificationCull();
    }

    /**
     * Check if the notifications exceed the max, if so, remove elements at the start of the queue.
     */
    private static checkNotificationCull() {
        if (this.notification_history.length > this.notification_max) {
            let cull_index = this.notification_count - this.notification_max -1;
            $(this.notification_history[cull_index]).remove();
            delete this.notification_history[cull_index];
        }
    }

    /**
     * Event handler for the step button
     * @param callback callback for next simulation step
     */
    private static onStepButtonClick(callback: CallableFunction) {
        callback();
        if (Inspector.current_settlement) {
            Inspector.showSettlement(Inspector.current_settlement);
        }
        if (Inspector.current_kingdom) {
            Inspector.showKingdomInfo(Inspector.current_kingdom)
        }
    }

    /**
     * Shows a settlement's details on the inspector
     * @param s the settlement to show
     */
    public static showSettlement(s: Settlement) {
        
        //clear previous
        $(this.field_list).empty();
        $(this.garrison_list).empty();

        if (s.node_id !== "battlefield") { //has garrison
            $(this.garrison_container).removeClass("d-none");
            this.inspector_settlement_name.innerHTML = `(${s.name})`;
            if (s.besieged) {
                $(this.inspector_settlement_name).css({
                    "color": "red",
                    "font-style": "italic"
                })
            }
            else {
                $(this.inspector_settlement_name).css({
                    "color": "white",
                    "font-style": "normal"
                })
            }

            //build the list
            let container = $(`<div class="p-4"></div>`);
            let colour = s.getKingdom()!.colour;
            let list = $(`<ul></ul>`);
            list.append(`<li style="color:${colour}">${s.garrison} - Garrison</li>`);
            let kingdom_total = s.garrison;
            for (let lord of s.garrison_lords) {
                if (lord.behaviour_state !== 5) {
                    list.append(`<li style="color:${colour}">${lord.warband_size} - ${lord.name}</li>`);
                    kingdom_total += lord.warband_size;
                }
            }
            let title = $(`<h3 style="color:${colour}">${s.getKingdom()!.name}: ${kingdom_total}</h3>`);
            container.append(title);
            container.append(list);
            $(this.garrison_list).append(container);
        }
        else {
            $(this.garrison_container).addClass("d-none");
        }

        //build field list

        //catalogue the field lords by kingdom
        let field_lords: any = {};
        for (let lord of s.field_lords) {
            if (lord.behaviour_state !== 5) {
                if (!field_lords[lord.getKingdom().name]) {
                    field_lords[lord.getKingdom().name] = [];
                }
                field_lords[lord.getKingdom().name].push(lord);
            }
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
            $(this.field_list).append(container);
        }
        this.current_settlement = s;
    }

}