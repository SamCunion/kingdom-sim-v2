import { Renderer, Scene, SolidRenderer, Vector2 } from "./lib/TSRL";
import Settlement from "./Settlement";

export default class Battlefield extends Settlement {

    public override node_id = "battlefield";
    public override strategic_value: number = 0;
    public override siege_duration: number = 0;
    public override siege_defender_power_multiplier: number = 0;

    private static battlefields: Battlefield[] = [];

    constructor(scene: Scene, name: string) {
        super(scene, name);
        this.setDimensions(new Vector2(20, 20));

        Battlefield.battlefields.push(this);
    }

    //STATIC METHODS
    /**
     * Returns the list of battlefields
     * @returns the complete list of battlefields
     */
    public static getBattlefields(): Battlefield[] {
        return this.battlefields;
    }

    Renderer: Renderer = new SolidRenderer("black");

}