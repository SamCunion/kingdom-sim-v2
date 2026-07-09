import { Component } from "./Component";
import { Vector2 } from "./Vector2";

export class Engine {

    private container: HTMLElement;
    private cameraPosition: Vector2 = new Vector2(0, 0);
    private element: HTMLCanvasElement|null = null;
    private engineH: number|null = null;
    private engineW: number|null = null;
    private FPSCap: number|null = null;
    private FPSLastCheck: number = 0;
    private LastFrameTime: number = 0;
    private ctx: CanvasRenderingContext2D|null = null;
    private fixedUpdateInterval: number = 10;
    private mousePoint: Vector2 = new Vector2(0, 0);
    private renderComponents: Array<Component> = [];
    private zComponents: Array<String> = [];
    private mouse_down_components: Array<Component> = [];
    private mouse_up_components: Array<Component> = [];
    private scroll_components: Array<Component> = [];
    private keydown_components: Array<Component> = [];
    private keyup_components: Array<Component> = [];
    private stopped: boolean = false;
    
    private EngineStatusInfo: EngineInfo = {
        FPS: 0,
        FPSTotal: 0,
        engine: this,
        fixedInterval: this.fixedUpdateInterval
    }
    
    constructor(aContianer: HTMLElement) {
        this.container = aContianer;
    }

    /**
     * Passes initiation information to the engine, and applies the effects.
     */
    public Init(options: EngineInit) {
        this.engineH = options.height;
        this.engineW = options.width;
        this.FPSCap = options.FPSCap ?? null;

        this.element = document.createElement("canvas");
        this.element.height = this.engineH;
        this.element.width = this.engineW;
        this.element.className = "SJRL2D_App";
        this.element.oncontextmenu = function() {
            return false;
        }

        //set elem background color
        this.element.style.backgroundColor = options.background ?? "transparent";

        this.container.appendChild(this.element);
        this.ctx = this.element.getContext("2d");

        //mouse position
        this.element.addEventListener("mousemove", this.mousemove);
        this.element.addEventListener("mouseleave", this.mouseleave);

        //=========================================================================================================
        //events

        //mousedown
        this.element.addEventListener("mousedown", this.mousedown);
        
        //mouseup
        this.element.addEventListener("mouseup", this.mouseup);

        //scroll
        document.addEventListener("wheel", this.wheel);

        //keydown
        document.addEventListener("keydown", this.keydown);

        //keyup
        document.addEventListener("keyup", this.keyup);
    }

    /**
     * Event listener functions
     */
    private mousemove = (e: MouseEvent) => {
        let rect = this.element!.getBoundingClientRect();
        this.mousePoint.x = e.x - rect.x + this.cameraPosition.x;
        this.mousePoint.y = e.y - rect.y + this.cameraPosition.y;
    }

    private mouseleave = (e: MouseEvent) => {
        this.mousePoint.x = -Infinity;
        this.mousePoint.y = -Infinity;
    }

    private mousedown = (e: MouseEvent) => {
        for (let i = this.mouse_down_components.length - 1; i >= 0; i--) {
            let comp = this.mouse_down_components[i];
            if (comp.enabled && this.isComponentWithinCamera(comp)) {
                if (comp.isPointInComponent(this.mousePoint, this.cameraPosition)) {
                    comp.MouseDown(e);
                    break;
                }
            }
        }
    }

    private mouseup = (e: MouseEvent) => {
        for (let i = this.mouse_up_components.length - 1; i >= 0; i--) {
            let comp = this.mouse_up_components[i];
            if (comp.enabled && this.isComponentWithinCamera(comp)) {
                if (comp.isPointInComponent(this.mousePoint, this.cameraPosition)) {
                    comp.MouseUp(e);
                    break;
                }
            }
        }
    }

    private wheel = (e: WheelEvent) => {
        for (let i = 0; i < this.scroll_components.length; i++) {
            let comp = this.scroll_components[i];
            if (comp.enabled) {
                comp.ScrollWheel(e);
            }
        }
    }

    private keydown = (e: KeyboardEvent) => {
        for (let i = 0; i < this.keydown_components.length; i++) {
            let comp = this.keydown_components[i];
            if (comp.enabled) {
                comp.KeyDown(e);
            }
        }
    }

    private keyup = (e: KeyboardEvent) => {
        for (let i = 0; i < this.keyup_components.length; i++) {
            let comp = this.keyup_components[i];
            if (comp.enabled) {
                comp.KeyUp(e);
            }
        }
    }

    /**
     * Runs the rendering process
     */
    public Run() {
        let self = this;
        window.requestAnimationFrame(() => {
            this.loop(this);
        });

        //FixedUpdate methods
        triggerFixedUpdate();
        function triggerFixedUpdate() {
            self.renderComponents.forEach(comp => {
                if (comp.FixedUpdate && comp.enabled) {
                    comp.FixedUpdate(self.EngineStatusInfo);
                }
            })
            if (!self.stopped) {
                setTimeout(triggerFixedUpdate, self.fixedUpdateInterval);
            }
        }

        let fps_interval = setInterval(() => {
            this.FPSChecker(this);
            if (this.stopped) {
                clearInterval(fps_interval);
            } 
        }, 1000);
    }

    /**
     * Stops the engine from running, cannot be started.
     */
    public Stop() {
        this.stopped = true;
        this.element!.removeEventListener("mousedown", this.mousedown);
        this.element!.removeEventListener("mouseup", this.mouseup);
        this.element!.removeEventListener("mousemove", this.mousemove);
        this.element!.removeEventListener("mouseleave", this.mouseleave);
        document.removeEventListener("wheel", this.wheel);
        document.removeEventListener("keydown", this.keydown);
        document.removeEventListener("keyup", this.keyup);
    }

    /**
     * Removes the app from the page, and stops its processes if required
     */
    public Remove() {
        if (!this.stopped) {
            this.Stop();
        }
        this.element!.remove();
    }

    private loop(self: Engine) {

        let current_ms = window.performance.now();
        let desired_ms_per_frame = (1000 / self.FPSCap!);
        let elapsed_since_last_call = current_ms - self.LastFrameTime;
        let tempz: String[] = []

        if (typeof(self.FPSCap) !== "number" || (elapsed_since_last_call >= desired_ms_per_frame)) {
            this.EngineStatusInfo.FPSTotal++;
            let ctx = self.ctx;
            //run component's update method before frame draw
            this.renderComponents.forEach((e) => {
                if (e.Update && e.enabled) {
                    e.Update(self.EngineStatusInfo);
                }
                tempz.push(e.UID + e.getZ() + e.getLocation().x + e.getLocation().y + e.getDimensions().x + e.getDimensions().y);
            })

            //clear canvas
            ctx!.clearRect(0, 0, self.engineW!, self.engineH!);

            //draw the frame
            if (tempz.toString() != this.zComponents.toString()) {
                this.sortComponents();
                this.zComponents = tempz;
            }
            this.renderComponents.forEach((e) => {
                if (e.enabled && this.isComponentWithinCamera(e)) {
                    e.Renderer.Render(ctx!, e, this.cameraPosition);
                }
            })

            //late updates
            this.renderComponents.forEach((e) => {
                if (e.LateUpdate && e.enabled) {
                    e.LateUpdate(self.EngineStatusInfo);
                }
            })

            //makes sure any excess ms that has elapsed since the minimum time waited for new frame to be drawn is accounted for
            self.LastFrameTime = current_ms - (elapsed_since_last_call % desired_ms_per_frame);
        }

        window.requestAnimationFrame(() => {
            if (!this.stopped) {
                self.loop(self);
            }
        })

    }

    /**
     * Starts on 1000ms interval from when Run() is run. Checks the number of frames drawn since 1 second ago, and updates information in EngineStatusInfo accordingly.
     */
    private FPSChecker(self: Engine) {
        self.EngineStatusInfo.FPS = (this.EngineStatusInfo.FPSTotal - self.FPSLastCheck);
        self.FPSLastCheck = this.EngineStatusInfo.FPSTotal;
    }

    /**
     * Sets the number of milliseconds interval between each component's FixedUpdate() method is called.
     * @param ms ms per update
     */
    public setFixedUpdateInterval(ms: number) {
        this.fixedUpdateInterval = ms;
        this.EngineStatusInfo.fixedInterval = ms;
    }

    /**
     * Returns the mouse's location in Point format, null if the mouse is not currently on the canvas.
     * @returns the Point of the mouse if it's on the canvas, else null
     */
    public getMousePoint(): Vector2 {
        return this.mousePoint;
    }

    /**
     * Gets the canvas element the engine is using
     * @returns the canvas element
     */
    public getElement(): HTMLCanvasElement|null {
        return this.element;
    }

    /**
     * Determines if the component is within the bounds of the camera, or not
     * @param comp the component to check
     * @returns true if the component is within the bounds of the camera, else false
     */
    public isComponentWithinCamera(comp: Component): boolean {
        if (comp.static) { //static components are always rendered
            return true;
        }

        let x = comp.bundleMaster ? comp.getLocation().x + comp.bundleMaster.getLocation().x : comp.getLocation().x;
        let y = comp.bundleMaster ? comp.getLocation().y + comp.bundleMaster.getLocation().y : comp.getLocation().y;

        if (
            (x + comp.getDimensions().x - this.cameraPosition.x < 0) || //off sceen left
            (y - this.cameraPosition.x > this.engineW!) || //off screen right
            (x + comp.getDimensions().y - this.cameraPosition.y < 0) || //off screen top
            (y - this.cameraPosition.y > this.engineH!) //off screen bottom
        ) {
            return false;
        }
        return true;
    }

    /**
     * Adds a component or a list of components to the render list, where they will start being rendered
     * @param comp the component or list of components to add to the render list
     */
    public addToRender(comp: Component | Array<Component>) {
        let self = this;
        if (comp instanceof Component) {
            parseComp(comp);
        }
        else {
            comp.forEach(c => {
                parseComp(c);
            })
        }

        
        function parseComp(component: Component) {
            self.renderComponents.push(component);
            if (typeof (component.MouseDown) === "function") { //if component has a mousedown event
                self.mouse_down_components.push(component);
            }
            if (typeof (component.MouseUp) === "function") { //if component has a mouseup event
                self.mouse_up_components.push(component);
            }
            if (typeof (component.ScrollWheel) === "function") {
                self.scroll_components.push(component);
            }
            if (typeof (component.KeyDown) === "function") {
                self.keydown_components.push(component);
            }
            if (typeof (component.KeyUp) === "function") {
                self.keyup_components.push(component);
            }
        }

    }

    /**
     * Removes a component or a list of components from the render list
     * @param comp the component or list of components to be removed from the render list
     */
    public removeFromRender(comp: Component | Array<Component>) {
        let self = this;
        if (comp instanceof Component) {
            if (this.renderComponents.includes(comp)) {
                parseComp(comp);
            }
        }
        else {
            comp.forEach(c => {
                if (this.renderComponents.includes(c)) {
                    parseComp(c);
                }
            })
        }

        function parseComp(component: Component) {
            self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            if (typeof (component.MouseDown) === "function") { //if component has a mousedown event
                self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            }
            if (typeof (component.MouseUp) === "function") { //if component has a mouseup event
                self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            }
            if (typeof (component.ScrollWheel) === "function") {
                self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            }
            if (typeof (component.KeyDown) === "function") {
                self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            }
            if (typeof (component.KeyUp) === "function") {
                self.renderComponents.splice(self.renderComponents.indexOf(component), 1);
            }
        }

    }

    /**
     * Sorts the components list by z-index
     */
    private sortComponents() {
        //all
        this.renderComponents = this.renderComponents.sort(function (a: Component, b: Component) {
            return a.getZ() - b.getZ();
        })
        //mousedown
        this.mouse_down_components = this.mouse_down_components.sort(function (a: Component, b: Component) {
            return a.getZ() - b.getZ();
        })
        //mouseup
        this.mouse_up_components = this.mouse_up_components.sort(function (a: Component, b: Component) {
            return a.getZ() - b.getZ();
        })
    }

    /**
     * Returns information about the engine instance
     * @returns the engine's engine info object
     */
    public getEngineInfo(): EngineInfo {
        return this.EngineStatusInfo;
    }

    /**
     * Gets the current position of the "camera"
     * @returns the current camera position
     */
    public getCameraPos(): Vector2 {
        return this.cameraPosition;
    }
    /**
     * Sets the "camera" position
     * @param position the new position of the camera
     */
    public setCameraPos(position: Vector2) {
        this.cameraPosition = position;
    }

    /**
     * Gets the engines rendering context
     * @returns the engines rendering context
     */
    public getRenderingContext(): CanvasRenderingContext2D|null {
        return this.ctx;
    }

}

/**
 * Defines what information can be passed to initiate the engine
 */
interface EngineInit {
    height: number;
    width: number;
    FPSCap?: number;
    background?: string;
}

/**
 * Defines what information about the state of the engine components can access from update methods
 */
export interface EngineInfo {
    FPS: number,
    FPSTotal: number,
    engine: Engine,
    fixedInterval: number
}