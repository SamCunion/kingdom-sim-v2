import { Component } from "./Component";
import { Engine, EngineInfo } from "./Engine";
import { Sprite } from "./Sprite";
import { TextComponent } from "./TextComponent";
import { Vector2 } from "./Vector2";

/**
 * Defines how a component should be rendered, and provides the logic to do so
 */
export {
    Renderer,
    NullRenderer,
    SolidRenderer,
    SpriteRenderer,
    TextRenderer,
    AnimationRenderer
}

class NullRenderer implements Renderer {


    Render(ctx: CanvasRenderingContext2D, component: Component, cameraPos: Vector2) {
        return;
    }
}

class SolidRenderer implements Renderer {

    private color: string = "red";

    constructor(aColor: string) {
        this.color = aColor;
    }

    setColor(color: string) {
        this.color = color;
    }

    Render(ctx: CanvasRenderingContext2D, component: Component, cameraPos: Vector2) {
        ctx.globalAlpha = component.getOpacity();
        ctx.fillStyle = this.color;
        let x = component.bundleMaster ? component.getLocation().x + component.bundleMaster.getLocation().x : component.getLocation().x;
        let y = component.bundleMaster ? component.getLocation().y + component.bundleMaster.getLocation().y : component.getLocation().y;
        x = component.static ? x : x - cameraPos.x;
        y = component.static ? y : y - cameraPos.y;

        ctx.fillRect(x, y, component.getDimensions().x, component.getDimensions().y);
    }
}

class SpriteRenderer implements Renderer {

    private sprite: Sprite;
    private rotation: number = 0;

    constructor(sprite: Sprite) {
        this.sprite = sprite;
    }

    public setSprite(sprite: Sprite) {
        this.sprite = sprite;
    }

    public setRotation(angle: number) {
        this.rotation = angle;
    }

    Render(ctx: CanvasRenderingContext2D, component: Component, cameraPos: Vector2) {
        ctx.globalAlpha = component.getOpacity();
        let x = component.bundleMaster ? component.getLocation().x + component.bundleMaster.getLocation().x : component.getLocation().x;
        let y = component.bundleMaster ? component.getLocation().y + component.bundleMaster.getLocation().y : component.getLocation().y;
        x = component.static ? x : x - cameraPos.x;
        y = component.static ? y : y - cameraPos.y;
        if (this.rotation !== 0) {
            ctx.save();
            ctx.translate(component.getLocation().x + component.getDimensions().x / 2, component.getLocation().y + component.getDimensions().y / 2);
            ctx.rotate(this.rotation * Math.PI / 180);
            ctx.drawImage(this.sprite.drawnSprite, -component.getDimensions().x / 2, -component.getDimensions().y / 2, component.getDimensions().x, component.getDimensions().y);
            ctx.restore();
        }
        else {
            ctx.drawImage(this.sprite.drawnSprite, x, y, component.getDimensions().x, component.getDimensions().y);
        }
    }
}

class TextRenderer implements Renderer {

    private textmetric: TextMetrics|null = null;

    Render(ctx: CanvasRenderingContext2D, component: TextComponent, cameraPos: Vector2) {
        ctx.globalAlpha = component.getOpacity();
        ctx.font = component.getFont();
        ctx.textAlign = component.align
        ctx.textBaseline = component.baseline_align;
        ctx.direction = component.direction;
        let x = component.bundleMaster ? component.getLocation().x + component.bundleMaster.getLocation().x : component.getLocation().x;
        let y = component.bundleMaster ? component.getLocation().y + component.bundleMaster.getLocation().y : component.getLocation().y;
        x = component.static ? x : x - cameraPos.x;
        y = component.static ? y : y - cameraPos.y;
        if (component.getRenderingStyle() === "fill") { //fill
            ctx.fillStyle = component.style;
            ctx.fillText(component.getText(), x, y, component.getMaxWidth());
        }
        else { //stroke
            ctx.strokeStyle = component.style;
            ctx.strokeText(component.getText(), x, y, component.getMaxWidth());
        }

        //update h/w if required
        let new_metrics = ctx.measureText(component.getText());
        if ((this.textmetric === undefined) || ((new_metrics.width !== this.textmetric!.width) || (new_metrics.actualBoundingBoxDescent - new_metrics.actualBoundingBoxAscent !== this.textmetric!.actualBoundingBoxDescent - this.textmetric!.actualBoundingBoxAscent))) {
            this.textmetric = new_metrics;
            component.getDimensions().x = new_metrics.width;
            component.getDimensions().y = new_metrics.actualBoundingBoxDescent - new_metrics.actualBoundingBoxAscent;
        }
    }
}

class AnimationRenderer implements Renderer {

    private sprite_renderer_list: SpriteRenderer[] = [];
    private loop = false;
    private type = 0; //0 is frame based, 1 is time based
    private interval_obj: any = null;
    private interval = 1;
    private engine_info: EngineInfo;
    private startFrameNo: number = 0;
    private playing: boolean = false;
    private paused: boolean = false;
    private current_sprite_index: number = 0;

    /**
     * 
     * @param params 
     */
    constructor(params: IAnimationRendererParams) {
        if (params.sprites) {
            for (let i = 0; i < params.sprites.length; i++) {
                this.sprite_renderer_list.push(new SpriteRenderer(params.sprites[i]));
            }
        }
        if (typeof(params.interval) == "number") {
            this.Interval(params.interval)
        }
        if (typeof(params.loop) == "boolean") {
            this.Loop(params.loop);
        }
        if (typeof(params.type) == "number") {
            if (params.type == 0 || params.type == 1) {
                this.type = params.type;
            }
            else {
                this.type = 0;
            }
        }
        this.engine_info = params.engine.getEngineInfo();
    }

    /**
     * Starts the animation
     */
    public Start() {
        if (this.type == 0) { //frames
            this.startFrameNo = this.engine_info.FPSTotal;
        }
        else { //time
            this.interval_obj = setInterval(() => {
                this.current_sprite_index++;
                if (this.current_sprite_index == this.sprite_renderer_list.length) {
                    if (this.loop) {
                        this.current_sprite_index = 0;
                    }
                    else {
                        this.current_sprite_index--;
                        clearInterval(this.interval_obj);
                    }
                }
            }, this.interval);
        }
        this.playing = true;
        this.current_sprite_index = 0;
    }

    /**
     * Pauses/Unpauses the animation
     */
    public Pause() {
        if (!this.paused) {
            this.paused = true;
            if (this.type == 1) {
                clearInterval(this.interval_obj);
            }
        }
        else {
            this.paused = false;
            if (this.type == 1) {
                this.interval_obj = setInterval(() => {
                    this.current_sprite_index++;
                    if (this.current_sprite_index == this.sprite_renderer_list.length) {
                        if (this.loop) {
                            this.current_sprite_index = 0;
                        }
                        else {
                            this.current_sprite_index--;
                            clearInterval(this.interval_obj);
                        }
                    }
                }, this.interval);
            }
        }
    }

    /**
     * Unpauses the animation
     */
    public Unpause() {
        if (this.paused) {
            this.paused = false;
            if (this.type == 1) {
                this.interval_obj = setInterval(() => {
                    this.current_sprite_index++;
                    if (this.current_sprite_index == this.sprite_renderer_list.length) {
                        if (this.loop) {
                            this.current_sprite_index = 0;
                        }
                        else {
                            this.current_sprite_index--;
                            clearInterval(this.interval_obj);
                        }
                    }
                }, this.interval);
            }
        }
    }

    /**
     * Stops the animation and reverts to the first sprite
     */
    public Stop() {
        this.current_sprite_index = 0;
        this.playing = false;
        this.paused = false;
        clearInterval(this.interval_obj);
    }


    /**
     * Sets if the animation should loop or play once
     * @param doesLoop if the animation should loop or not
     */
    public Loop(doesLoop: boolean) {
        this.loop = doesLoop;
    }

    /**
     * Sets the number of frames between each sprite change (minimum of 1)
     * @param int frames between each sprite change
     */
    public Interval(int: number) {
        if (int > 0) {
            this.interval = int;
        }
        else {
            this.interval = 1;
        }
    }

    public Render(ctx: CanvasRenderingContext2D, component: Component, cameraPos: Vector2): void {
        ctx.globalAlpha = component.getOpacity();
        if (this.type == 0 && this.playing && !this.paused) {
            if (this.startFrameNo !== this.engine_info.FPSTotal && ((this.engine_info.FPSTotal - this.startFrameNo) % this.interval === 0)) { //next sprite
                this.current_sprite_index++;
                if (this.current_sprite_index == this.sprite_renderer_list.length) { //end of animation
                    if (this.loop) {
                        this.current_sprite_index = 0;
                        this.startFrameNo = this.engine_info.FPSTotal;
                    }
                    else {
                        this.playing = false;
                        this.current_sprite_index--;
                    }
                }
            }
        }
        else if (this.type == 0 && this.paused) {
            this.startFrameNo++;
        }
        this.sprite_renderer_list[this.current_sprite_index].Render(ctx, component, cameraPos);
    }
}
interface IAnimationRendererParams {
    /**
     * Initial set of sprites for the animation to use (in order)
     */
    sprites?: Sprite[],
    /**
     * Number of frames between the next frame being drawn
     */
    interval?: number,
    /**
     * Should the animation play once, or on loop
     */
    loop?: boolean,

    /**
     * Does the interval refer to frames (0) or time (1)
     */
    type?: number
    /**
     * The engine instance the animation will play on
     */
    engine: Engine
}

interface Renderer {
    Render(ctx: CanvasRenderingContext2D, component: Component, cameraPos: Vector2): void;
}