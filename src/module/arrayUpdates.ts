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
