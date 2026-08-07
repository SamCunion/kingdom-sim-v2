
/**
 * Represents a point in 2d space (x,y)
 */
export class Vector2 {
    public x : number;
    public y : number;
    /**
     * @param x pixel on the X axis
     * @param y pixel on the Y axis
     */
    constructor(X: number, Y: number) {
        this.x = X;
        this.y = Y;
    }

    /**
     * Gets the magnitude of the vector
     * @returns the magnitude
     */
    public Magnitude(): number {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
}