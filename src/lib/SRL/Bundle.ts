import { Component } from "./Component";

export class Bundle {

    private bundled_comps: Component[] = [];
    private bundleMaster: Component|null = null;
    
    /**
     * Binds a list of components together. The X and Y position of higher components is determined relative to the lowest component.
     * @param initial_components the initial bundle of components
     */
    constructor(initial_components: Component[]) {
        this.set(initial_components);
    }

    /**
     * Adds one or more new components to the bundle
     * @param comps the component(s) to add to the bundle
     */
    public add(comps: Component | Component[]) {
        let self = this;
        if (comps instanceof Component) {
            parseComp(comps);
        }
        else {
            comps.forEach(c => {
                parseComp(c);
            })
        }
        function parseComp(comp: Component) {
            self.bundled_comps.push(comp);
            comp.bundleMaster = self.bundleMaster;
            comp.setZ(self.bundleMaster!.getZ() + self.bundled_comps.length);
        }
    }

    /**
     * Removes one or more components from the bundle
     * @param comps the component(s) to remove from the bundle
     */
    public remove(comps: Component | Component[]) {
        let self = this;
        if (comps instanceof Component) {
            parseComp(comps);
        }
        else {
            comps.forEach(c => {
                parseComp(c);
            })
        }
        function parseComp(comp: Component) {
            self.bundled_comps.splice(self.bundled_comps.indexOf(comp), 1);
            comp.setZ(comp.getZ() - comp.bundleMaster!.getZ());
            comp.bundleMaster = null;
        }
    }

    /**
     * Sets the bundle to contain the new list of components
     * @param comps list of components in the order of rendering priority (first is lowest)
     */
    public set(comps: Component[]) {
        this.bundled_comps = [];
        this.bundleMaster = comps[0];
        this.bundled_comps.push(comps[0]);
        for (let i = 1; i < comps.length; i++) {
            comps[i].setZ(this.bundleMaster.getZ() + i);
            comps[i].bundleMaster = this.bundleMaster;
            this.bundled_comps.push(comps[i]);
        }
    }

    /**
     * Enables all bundled components
     */
    public enable() {
        this.bundled_comps.forEach(e => {
            e.enable();
        })
    }

    /**
     * Disables all bundled components
     */
    public disable() {
        this.bundled_comps.forEach(e => {
            e.disable();
        })
    }

    /**
     * Returns a list containing the components in this bundle
     * @returns the list of components in the bundle
     */
    public getBundledComps(): Component[] {
        return this.bundled_comps;
    }

    /**
     * Gets the bundle master of the bundle (the component the others components position is relative to)
     * @returns the bundle master
     */
    public getMaster(): Component|null {
        return this.bundleMaster;
    }

}