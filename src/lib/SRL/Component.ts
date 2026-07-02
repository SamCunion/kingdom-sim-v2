import { Scene } from "./Scene";
import { EngineInfo } from "./Engine";
import { Vector2 } from "./Vector2";
import { Renderer } from "./Renderers";

export abstract class Component {

    private location: Vector2 = new Vector2(0, 0);
    private dimensions: Vector2 = new Vector2(0, 0);
    private z: number = 0;
    public enabled: boolean = true;
    public bundleMaster: Component|null = null;
    public UID: string = crypto.randomUUID();
    public static = false;
    private opacity: number = 1;

    /**
     * Abstract class represents a renderable engine component.
     * @param scene Optional - automatically adds the new component to a given Scene.
     */
    constructor(scene?: Scene) {
        scene ? scene.add(this) : undefined;
    }

    /**
     * Sets the location of the component
     * @param point Location point
     */
    public setLocation(point: Vector2) {
        this.location = point;
    }
    /**
     * Gets the location of the component
     * @returns the location
     */
    public getLocation() : Vector2 {
        return this.location;
    }

    /**
     * Sets the new dimensions for the component
     * @param dims the new dimensions for the component
     */
    public setDimensions(dims: Vector2) {
        this.dimensions = dims;
    }

    /**
     * Gets the component's dimensions
     * @returns the component's dimensions
     */
    public getDimensions(): Vector2 {
        return this.dimensions;
    }

    /**
     * Sets the opacity (transparentness) of the component
     * @param opacity the new opacity of the component between 0-1 inclusive
     */
    public setOpacity(opacity: number) {
        if (opacity >= 0 && opacity <= 1) {
            this.opacity = opacity;
        }
    }

    /**
     * Gets the opacity (transparentness) of the component
     * @returns the component's opacity
     */
    public getOpacity(): number {
        return this.opacity;
    }

    /**
     * Determines if the given point falls within the bounds of the component
     * @param point the point to check
     */
    isPointInComponent(point: Vector2, cameraPos: Vector2) : boolean {
        let x = this.bundleMaster ? this.location.x + this.bundleMaster.getLocation().x : this.location.x;
        let y = this.bundleMaster ? this.location.y + this.bundleMaster.getLocation().y : this.location.y;
        x = this.static ? x + cameraPos.x : x;
        y = this.static ? y + cameraPos.y : y;
        
        return (x <= point.x) && (point.x <= x + this.dimensions.x) && (y <= point.y) && (point.y <= y + this.dimensions.y);
    }

    /**
     * Checks if the component is overlapping with another.
     * @param component the component(s) to check for collision with
     * @returns an array of Components that collision is detected with
     */
    collision(component: Component): Array<Component>;
    collision(component: Array<Component>): Array<Component>;
    collision(component: any) : Array<Component> {
        let out = [];
        let self = this;
        
        if (component instanceof Array) { //array of Components
            component.forEach(comp => {
                if (detectCol(comp)) {
                    out.push(comp);
                }
            })
        }
        else { //solitary Component
            if (detectCol(component)) {
                out.push(component);
            }
        }

        function detectCol(instance : Component): boolean { //performs bounding box collision detection between the components
            let sOffsetX = self.bundleMaster ? self.bundleMaster.getLocation().x : 0;
            let sOffsetY = self.bundleMaster ? self.bundleMaster.getLocation().y : 0;
            let cOffsetX = instance.bundleMaster ? instance.bundleMaster.getLocation().x : 0;
            let cOffsetY = instance.bundleMaster ? instance.bundleMaster.getDimensions().y : 0;
            return (self.location.x + sOffsetX < instance.location.x + cOffsetX + instance.getDimensions().x) && (self.location.x + sOffsetX + self.dimensions.x > instance.location.x + cOffsetX) && (self.location.y + sOffsetY < instance.location.y + cOffsetY + instance.getDimensions().y) && (self.location.y + sOffsetY + self.dimensions.y > instance.location.y + cOffsetY);
        }

        return out;
    }

    /**
     * Enables the component
     */
    enable() {
        this.enabled = true;
    }
    
    /**
     * Disables the component (includes rendering and calls to Update() methods)
     */
    disable() {
        this.enabled = false;
    }

    /**
     * Changes the z-index of the component, which affects the layer the component is rendered to (also affects events)
     * @param zIndex the z-index to set the component to
     */
    setZ(zIndex: number) {
        this.z = zIndex;
    }
    
    /**
     * Gets the z-index of the component
     * @returns the z-index
     */
    getZ(): number {
        return this.z;
    }

    /**
     * Gets the unique ID of the component
     * @returns the UID of the component
     */
    public toString(): string {
        return this.UID;
    }

}

export interface Component {
    /**
     * Code inside this block gets executed before every frame is drawn
     * @param info information about the engine
     */
    Update(info?: EngineInfo): void;
    /**
     * Code inside this block gets executed every period of time (default is 10ms)
     * @param info information about the engine
     */
    FixedUpdate(info?: EngineInfo): void;
    /**
     * Runs when the component is clicked on (highest z-index priority, blocking)
     * @param event mouse event
     */
    MouseDown(event: MouseEvent): void;
    /**
     * Runs when the component is clicked off (highest z-index priority, blocking)
     * @param event mouse event
     */
    MouseUp(event: MouseEvent) : void;
    /**
     * Runs when the scroll wheel is moved (regardless of mouse position)
     * @param event wheel event
     */
    ScrollWheel(event: WheelEvent) : void;
    /**
     * Runs when a key is pressed down (regardless of mouse position)
     * @param event keyboard event
     */
    KeyDown(event: KeyboardEvent) : void;
    /**
     * Runs when a key is released (regardless of mouse position)
     * @param event keyboard event
     */
    KeyUp(event: KeyboardEvent) : void;
    Renderer: Renderer;
}