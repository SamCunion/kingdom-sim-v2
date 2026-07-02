import { Vector2 } from "./Vector2";

//========================================Random================================================================

/**
 * Returns an unbiased integer between max and min
 * @param min minimum value
 * @param max maximum value
 * @param include_max maximum value is inclusive
 * @returns random integer
 */
function randInt(min: number, max: number, include_max?: boolean): number {
    if (include_max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Generates a random biased integer, with regards to a supplied mean and standard deviation
 * @param min minimum possible value (inclusive)
 * @param max maximum possible value (exclusive)
 * @param mean average value
 * @param standard_deviation how "wide" the curve will be
 * @returns a biased random integer
 */
function randGaussianInt(min: number, max: number, mean: number, standard_deviation: number = 1) {
    /**
     * As defined by Tom Liao (2019) https://spin.atomicobject.com/2019/09/30/skew-normal-prng-javascript/
     */
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random();
    while (u2 === 0) u2 = Math.random();
    let r = Math.sqrt(-2 * Math.log(u1));
    let O = 2 * Math.PI * u2;
    let r1 = r * Math.cos(O);
    let out = Math.ceil(mean + (standard_deviation * r1));
    if (out < min || out > max) {
        return randGaussianInt(min, max, mean, standard_deviation);
    }
    return out;

}

/**
 * Returns a random item in the given list
 * @param list the list
 * @returns random item in the list
 */
function randItem(list: Array<any>): any {
    return list[randInt(0, list.length)];
}

/**
 * Returns a random index number of the list
 * @param list the list
 * @returns a random index of the list
 */
function randIndex(list: Array<any>): number {
    return randInt(0, list.length);
}

class SeededRandomNG {

    private a: number;
    private b: number;
    private c: number;
    private d: number;
    private lower: number = 0;
    private upper: number = 1;

    /**
     * Creates a new instance of a seeded random number generator.
     * @param seed the seed
     */
    constructor(seed: string) {
        let hash = this.cryb128(seed);
        this.a = hash[0];
        this.b = hash[1];
        this.c = hash[2];
        this.d = hash[3];
        this.sfc32();
    }

    /**
     * Takes the hash and generates the next pseudorandom number
     * @returns new pseudorandom number
     */
    private sfc32(): number {
        this.a |= 0;
        this.b |= 0;
        this.c |= 0;
        this.d |= 0;
        let t = (this.a + this.b | 0) + this.d | 0;
        this.d = this.d + 1 | 0;
        this.a = this.b ^ this.b >>> 9;
        this.b = this.c + (this.c << 3) | 0;
        this.c = this.c + t | 0;
        return (t >>> 0) / 4294967296;
    }

    /**
     * Takes the initial seed and creates a hash from it.
     * @param str initial seed
     * @returns the hash
     */
    private cryb128(str: string): number[] {
        let h1 = 1779033703;
        let h2 = 3144134277;
        let h3 = 1013904242;
        let h4 = 2773480762;
        for (let i = 0; i < str.length; i++) {
            let k = str.charCodeAt(i);
            h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
            h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
            h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
            h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
        }
        h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
        h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
        h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
        h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
        h1 ^= (h2 ^ h3 ^ h4), h2 ^= h1, h3 ^= h1, h4 ^= h1;
        return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
    }

    /**
     * Clamps the results from the random number generator between the given bounds (inclusive).
     * @param lower lower bound
     * @param upper upper bound
     */
    public clampBetween(lower: number, upper: number) {
        this.lower = lower;
        this.upper = upper;
    }

    /**
     * Returns the next pseudorandom number in the sequence.
     * @returns the next number in the sequence
     */
    public Next(): number {
        return this.sfc32() * (this.upper - this.lower + 1) + this.lower;
    }
}

//========================================Cookies================================================================
function setCookie(name: string, value: string, expires: number) {
    let date = new Date();
    date.setTime(date.getTime() + expires);
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
}

/**
 * Gets the contents of a cookie by a given name. If none found, returns empty string.
 * @param name the name of the cookie to read
 * @returns the contents of a cookie by a given name or null
 */
function getCookie(name: string): string|null {
    let fname = name + "=";
    let decodedURI = decodeURIComponent(document.cookie);
    let cookieList = decodedURI.split(";");
    for (let i = 0; i < cookieList.length; i++) {
        let cookie = cookieList[i];
        while (cookie.charAt(0) === " ") {
            cookie = cookie.substring(1);
        }
        if (cookie.indexOf(fname) === 0) {
            return cookie.substring(fname.length, cookie.length);
        }
    }
    return null;
}

/**
 * Deletes a cookie with the given name
 * @param name name of the cookie to delete
 */
function removeCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

//=====================Array Methods===============================
/**
 * Removes the item at the index from the given array in place.
 * @param array the array to mutate
 * @param index index of the item to be removed from it
 * @returns true if operation was successful, else false
 */
function removeIndex(array: any[], index: number): boolean {
    let out = array.splice(index, 1);
    if (out.length > 0) {
        return true;
    }
    return false;
}

/**
 * Removes the item from the given array in place.
 * @param array the array to mutate
 * @param item item to be removed from it
 * @returns true if operation was successful, else false
 */
function removeItem(array: any[], item: any): boolean {
    if (array.indexOf(item) > -1) {
        return removeIndex(array, array.indexOf(item));
    }
    return false;
}

/**
 * Removes all occurences of the item from the array in place.
 * @param array the array to mutate
 * @param item item to be removed from it in every occurence
 * @returns true if the operation was successful, else false
 */
function removeAll(array: any[], item: any): boolean {
    let flag = false;
    while (array.indexOf(item) >= 0) {
        if (removeItem(array, item)) {
            flag = true;
        }
    }
    return flag;
}

/**
 * Removes all elements of the given type from the array.
 * @param array the array to mutate
 * @param instance the type of which all instances will be removed from the array
 * @returns true if the operation was successful, else false
 */
function removeInstance(array: any[], instance: any): boolean {
    let i = array.length;
    let flag = false;
    while (i--) {
        if (array[i] instanceof instance) {
            if (removeIndex(array, i)) {
                flag = true;
            }
        }
    }
    return flag;
}

/**
 * Returns a random permutation of the items in the given array (creates a copy)
 * @param array the array to shuffle
 * @returns the shuffled array
 */
function shuffle(array: any[]): any[] {
    let copy = [...array];
    let i = copy.length;
    while (i !== 0) {
        let j = Math.floor(Math.random() * i);
        i--;
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

//=====================Math Methods===============================

/**
 * Linearly interpolates between two points
 * @param a point A
 * @param b point B
 * @param t the fraction between the two
 * @returns Vector2 between the two points
 */
function lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    if (t > 1 || t < 0) {
        throw new RangeError("Value of t supplied to lerp() must be between 0 and 1 inclusive (got " + t + ")");
    }
    let i = b.x - a.x;
    let j = b.y - a.y;
    i *= t;
    j *= t;
    i += a.x;
    j += a.y;
    return new Vector2(i, j);
}

//=====================Exports===============================

export const Utility = {
    random: {
        randInt: randInt,
        randGaussianInt: randGaussianInt,
        randItem: randItem,
        randIndex: randIndex,
        SeededRandomNG: SeededRandomNG
    },

    cookie: {
        setCookie: setCookie,
        getCookie: getCookie,
        removeCookie: removeCookie
    },

    array: {
        removeIndex: removeIndex,
        removeItem: removeItem,
        removeAll: removeAll,
        removeInstance: removeInstance,
        shuffle: shuffle
    },

    math: {
        lerp: lerp
    }
}
export interface Utility {
    random: object,
    cookie: object,
    array: object
}