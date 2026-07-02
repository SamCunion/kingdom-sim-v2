import {Component} from "./Component";
import { Engine } from "./Engine";

/**
 * A "Scene", groups instances of objects that conform to IEngineRenderable and performs desired operations on all at once
 */
export class Scene {

    private batchedComponents: Array<Component> = [];
    private engine: Engine;
    private showing: boolean = false;

    constructor(anEngine: Engine) {
        this.engine = anEngine;
    }

    /**
     * Adds a single Component to the batch (duplicates will fail)
     * @param component a component to add to the batch
     * @returns true if component successfully added, else false
     */
    public add(component: Component) : boolean {
        if (this.contains(component)) {
            return false;
        }
        this.batchedComponents.push(component);
        if (component.enabled && this.showing) {
            this.engine.addToRender(component);
        }
        return true;
    }

    /**
     * Adds many Component to the batch (duplicates will fail)
     * @param components array of components to be added to the batch
     * @returns true if all components successfully added, else false
     */
    public addMany(components: Array<Component>) : boolean {
        let out = true;
        components.forEach((e) => {
            if (!this.add(e)) {
                out = false;
            }
        })
        return out;
    }

    /**
     * Removes a single component from the batch, if it exists in the batch
     * @param component the component to be removed from the collection
     * @returns true if the component is successfully removed, else false if not found.
     */
    public remove(component: Component) : boolean {
        if (this.contains(component)) {
            this.batchedComponents.splice(this.batchedComponents.indexOf(component), 1);
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * Removes a group of elements from the batch (if each exists in the batch)
     * @param components Array of components to remove from the batch
     * @returns true if all elements are successfully removed, else false.
     */
    public removeMany(components: Array<Component>) : boolean {
        let out = true;
        components.forEach((e) => {
            if (!this.remove(e)) {
                out = false;
            }
        })
        return out;
    }

    /**
     * Checks if a component exists in the collection
     * @param component the component to check
     * @returns true if component is found, else false
     */
    public contains(component: Component): boolean {
        return this.batchedComponents.includes(component);
    }

    public show() {
        this.engine.addToRender(this.batchedComponents);
        this.showing = true;
    }

    public hide() {
        this.engine.removeFromRender(this.batchedComponents);
        this.showing = false;
    }
}