/**
 * Create a Proxy that triggers a method at the conclusion of array updates (add/remove)
 * @param onArrayUpdate - Method to trigger
 * @param initialArray - Initial array with elements
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ArrayUpdateProxy(onArrayUpdate: () => void, initialArray: Array<any> = []): Array<any> {
    return new Proxy(initialArray, {
        get: (target, property) => {
            return target[property];
        },
        set: (target, property, value) => {
            target[property] = value;

            if (property == `length`)
                onArrayUpdate();

            return true;
        }
    });
}

export {
    ArrayUpdateProxy,
};
