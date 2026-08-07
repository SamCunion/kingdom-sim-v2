import { Component } from "./Component";
import { LineRenderer } from "./Renderers";
import { Scene } from "./Scene";
import { Vector2 } from "./Vector2";

export class LineComponent extends Component {

    constructor(scene: Scene) {
        super(scene);
    }

    private line_begin: Vector2 = new Vector2(0, 0);
    private line_end: Vector2 = new Vector2(0, 0);
    private line_width: number = 1;
    private colour: string = "black";
    private cap: "butt"|"round"|"square" = "butt";
    private line_dash_length: number = 0;
    private line_dash_gap: number = 0;

    /**
     * Sets the starting point of the line
     * @param point the point the line starts at
     */
    public setLineBegin(point: Vector2) {
        this.line_begin = point;
    }
    /**
     * Gets the current beginning point of the line
     * @returns the current beginning point of the line
     */
    public getLineBegin(): Vector2 {
        return this.line_begin;
    }

    /**
     * Sets the ending point of the line
     * @param point the point the line ends at
     */
    public setLineEnd(point: Vector2) {
        this.line_end = point;
    }
    /**
     * Gets the current ending point of the line
     * @returns the current ending point of the line
     */
    public getLineEnd(): Vector2 {
        return this.line_end;
    }

    /**
     * Gets the current line width
     * @returns the current line width
     */
    public getLineWidth(): number {
        return this.line_width;
    }
    /**
     * Sets the lines width
     * @param width the new line width
     */
    public setLineWidth(width: number) {
        this.line_width = width;
    }

    /**
     * Gets the current line colour
     * @returns the current line colour
     */
    public getColour(): string {
        return this.colour;
    }
    /**
     * Sets the lines colour
     * @param colour the new line colour
     */
    public setColour(colour: string) {
        this.colour = colour;
    }

    /**
     * Gets the current line cap style
     * @returns the current line cap style
     */
    public getCap(): "butt"|"round"|"square" {
        return this.cap;
    }
    /**
     * Sets the lines cap style
     * @param cap the new cap style
     */
    public setCap(cap: "butt"|"round"|"square") {
        this.cap = cap;
    }

    /**
     * Gets the lines dash length
     * @returns the current line dash segment length
     */
    public getLineDashLength(): number {
        return this.line_dash_length;
    }
    /**
     * Sets the lines dash length
     * @param dash_length the new line dash segment length
     */
    public setLineDashLength(dash_length: number) {
        this.line_dash_length = dash_length;
    }

    /**
     * Gets the gap between dashed segments in the line
     * @returns the current gap between line dash segments
     */
    public getLineGapLength(): number {
        return this.line_dash_gap;
    }
    /**
     * Sets the gap between dashed segments in the line
     * @param gap_length the new gap between line dash segments
     */
    public setLineGapLength(gap_length: number) {
        this.line_dash_gap = gap_length;
    }

    public override collision(component: Component): Array<Component>;
    public override collision(component: Array<Component>): Array<Component>;
    public override collision(component: any): Array<Component> {
        throw Error("Should not use collision with line components, use 'intersects' instead.");
    }
    
    public intersects(comp: Component): boolean {
        const x1 = this.line_begin.x;
        const x2 = this.line_end.x;
        const y1 = this.line_begin.y;
        const y2 = this.line_end.y;
        const rx = comp.getLocation().x;
        const ry = comp.getLocation().y;
        const rw = comp.getDimensions().x;
        const rh = comp.getDimensions().y;

        //check if either beginning point or end point are within the component
        if (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) return true;
        if (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh) return true;

        //detect intersection between the line and the 4 lines that make up the rectangle
        const left = lineIntersects(x1, y1, x2, y2, rx, ry, rx, ry + rh);
        const right = lineIntersects(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh);
        const top = lineIntersects(x1, y1, x2, y2, rx, ry, rx + rw, ry);
        const bottom = lineIntersects(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh);

        //if any of the lines intersect, theres an intersection
        return left || right || top || bottom;

        /**
         * Detects if two lines intersect
         * @returns true if the two lines intersect, else false
         */
        function lineIntersects(a1x: number, a1y: number, a2x: number, a2y: number, b1x: number, b1y: number, b2x: number, b2y: number): boolean {
            const det = (a2x - a1x) * (b2y - b1y) - (b2x - b1x) * (a2y - a1y);
            if (det === 0) return false;

            const u = ((b1x - a1x) * (b2y - b1y) - (b2x - b1x) * (b1y - a1y)) / det;
            const v = ((b1x - a1x) * (a2y - a1y) - (a2x - a1x) * (b1y - a1y)) / det;

            return (u >= 0 && u <= 1) && (v >= 0 && v <= 1);
        }
    }

    public readonly Renderer: LineRenderer = new LineRenderer();
}