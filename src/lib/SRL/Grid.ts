import { Bundle } from "./Bundle";
import { Component } from "./Component";
import { NullRenderer, Renderer } from "./Renderers";
import { Scene } from "./Scene";
import { Vector2 } from "./Vector2";

/**
 * Grid class groups a number of components, bundles them, and displays them in a gridular format. The location of the top left cell determines the location of each cell.
 */
export class Grid extends Bundle {

    private grid_dimensions: Vector2 = new Vector2(0, 0);
    private cell_dimensions: Vector2 = new Vector2(0, 0);

    /**
     * @param initial_components components to be immediately loaded into the grid
     * @param grid_dimensions the height and width of the grid in cells
     * @param cell_dimensions the hight and width of the cells
     */
    constructor(initial_components: Component[], grid_dimensions: Vector2, cell_dimensions: Vector2) {
        super(initial_components);
        this.setCellDimensions(cell_dimensions);
        this.setGridDimensions(grid_dimensions);
        for (let i = 0; i < initial_components.length; i++) {
            let comp = initial_components[i];
            comp.setDimensions(cell_dimensions);
            comp.getLocation().x = (i % grid_dimensions.x) * cell_dimensions.x;
            comp.getLocation().y = Math.floor(i / grid_dimensions.x) * cell_dimensions.y;
            comp.setZ(initial_components[0].getZ());
        }
        
    }

    /**
     * EmptyCell can be used to set a grid's cell to be empty. Create a new instance and pass it to the grid. Inherits Component
     */
    public static EmptyCell = class extends Component {
        constructor(scene: Scene) {
            super(scene);
        }

        Renderer: Renderer = new NullRenderer();
    }

    /**
     * Changes the grid location
     * @param location the new location of the grid
     */
    public setLocation(location: Vector2) {
        this.getMaster()!.setLocation(location);
    }

    /**
     * Sets the new high and widh of the grid in cells (must be > 0)
     * @param grid_dimensions the new height and width of the grid in cells
     * @returns true if the operation was successful, else false
     */
    public setGridDimensions(grid_dimensions: Vector2): boolean {
        if (grid_dimensions.x > 0 && grid_dimensions.y > 0) {
            this.grid_dimensions = grid_dimensions;
            return true;
        }
        return false;
    }

    /**
     * Sets the new size of each of the cells in the grid (must be > 0)
     * @param cell_dimensions the new dimensions of the cells in the grid
     * @returns true if the operation was successful, else false
     */
    public setCellDimensions(cell_dimensions: Vector2): boolean {
        if (cell_dimensions.x > 0 && cell_dimensions.y > 0) {
            this.cell_dimensions = cell_dimensions;
            return true;
        }
        return false;
    }

    /**
     * Places a new component within a cell in the grid
     * @param cell X and Y of the cell to be replaced
     * @param component The component to show in the cell
     * @returns true if the operation was successful, else false
     */
    public setCellAt(cell: Vector2, component: Component): boolean {
        if (cell.x < 0 || cell.y < 0 || cell.x >= this.grid_dimensions.x || cell.y >= this.cell_dimensions.x ) {
            return false;
        }
        component.setDimensions(this.cell_dimensions);
        component.getLocation().x = cell.x * this.cell_dimensions.x;
        component.getLocation().y = cell.y * this.cell_dimensions.y;
        let comps = [...this.getBundledComps()];
        let old_comp = comps[cell.x + Math.floor(cell.y * this.grid_dimensions.x)];
        old_comp.bundleMaster = null;
        comps[cell.x + Math.floor(cell.y * this.grid_dimensions.x)] = component;
        this.set(comps);
        for (let i = 0; i < comps.length; i++) {
            comps[i].setZ(comps[0].getZ());
        }
        return true;
    }

    /**
     * Returns the component at the given position in the grid, else null
     * @param location the x,y position of the component in the grid
     * @returns the component in the given position in the grid.
     */
    public getCellAt(location: Vector2): Component | null {
        let comp;
        try {
            comp = this.getBundledComps()[location.x + Math.floor(location.y * this.grid_dimensions.x)];
        }
        catch (err) {
            return null;
        }
        return comp;
    }


}