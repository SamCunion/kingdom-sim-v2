import { Component } from "./Component";
import { TextRenderer } from "./Renderers";
import { Scene } from "./Scene";
import { Vector2 } from "./Vector2";

export class TextComponent extends Component {


    constructor(scene: Scene) {
        super(scene);
    }

    private text: string = "";
    private max_width: number = window.outerWidth;
    private rendering_style = "fill";
    public font: string = "10px serif";
    public style: string = "black";
    public align: CanvasTextAlign = "start";
    public baseline_align: CanvasTextBaseline = "top";
    public direction: CanvasDirection = "inherit";

    /**
     * Changes the displayed text of the component
     * @param text text
     */
    public setText(text: string) {
        this.text = text;

        //update dimensions
        let ctx = document.createElement("canvas").getContext("2d");
        ctx!.font = this.getFont();
        ctx!.textAlign = this.align
        ctx!.textBaseline = this.baseline_align;
        ctx!.direction = this.direction;
        let metrics = ctx!.measureText(text);
        let w = metrics.width;
        if (metrics.width > this.max_width) {
            w = this.max_width;
        }
        this.getDimensions().x = w;
        this.getDimensions().y = metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent;
    }

    /**
     * Gets the currently set text of the component
     * @returns text
     */
    public getText(): string {
        return this.text;
    }

    /**
     * Sets the maximum width the text will be displayed
     * @param width width in px
     */
    public setMaxWidth(width: number) {
        this.max_width = width;
    }
    
    /**
     * Gets the maximum width the text will be displayed at, if already manually set.
     * @returns the currently set max width
     */
    public getMaxWidth(): number {
        return this.max_width;
    }

    /**
     * Sets the text rendering style to "fill" or "stroke" (default is "fill")
     * @param style "fill" or "stroke"
     * @returns true if the operation was successful, else false
     */
    public setRenderingStyle(style: string) : boolean {
        if (style === "fill" || style === "stroke") {
            this.rendering_style = style;
            return true;
        }
        return false;
    }
    public getRenderingStyle(): string {
        return this.rendering_style;
    }

    /**
     * Defines the font the text will adhere to.
     * @param font the string that defines the font
     */
    public setFont(font: string) {
        this.font = font;
    }
    /**
     * Gets the currently set font for the component
     * @returns font
     */
    public getFont(): string {
        return this.font;
    }

    public readonly Renderer: TextRenderer = new TextRenderer();
}

export interface TextComponent extends Component {
    readonly Renderer: TextRenderer;
}